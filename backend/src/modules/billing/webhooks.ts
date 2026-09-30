import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { payments, subscriptions, webhookEvents } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";
import { recomputePlan } from "./billing.service.js";
import { track } from "../../lib/analytics.js";

type Entity = Record<string, unknown> & { id: string };
type RazorpayEvent = {
  event: string;
  payload: {
    payment?: {
      entity: Entity & { order_id?: string; method?: string; amount?: number; notes?: Record<string, string> };
    };
    subscription?: {
      entity: Entity & { current_start?: number; current_end?: number; notes?: Record<string, string> };
    };
    refund?: { entity: Entity & { payment_id?: string } };
  };
};

const SEASON_PASS_MONTHS = 6;
const fromUnix = (seconds?: number) => (seconds ? new Date(seconds * 1000) : null);

// Razorpay retries deliveries; each event id is processed once.
async function firstDelivery(eventId: string | undefined) {
  if (!eventId) return true;
  const inserted = await db
    .insert(webhookEvents)
    .values({ id: `razorpay:${eventId}` })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  return inserted.length > 0;
}

async function onPaymentCaptured(payment: NonNullable<RazorpayEvent["payload"]["payment"]>["entity"], raw: unknown) {
  if (!payment.order_id) return; // Subscription payments are handled by subscription.charged.
  const [row] = await db.select().from(payments).where(eq(payments.razorpayOrderId, payment.order_id)).limit(1);
  if (!row || row.status === "captured") return;

  await db
    .update(payments)
    .set({ status: "captured", razorpayPaymentId: payment.id, method: payment.method ?? null, raw })
    .where(eq(payments.id, row.id));

  if (row.subscriptionId) {
    // A new Season Pass extends any time left on a current one.
    const [current] = await db
      .select({ end: subscriptions.currentPeriodEnd })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, row.userId),
          eq(subscriptions.plan, "season_pass"),
          eq(subscriptions.status, "active"),
        ),
      )
      .orderBy(subscriptions.currentPeriodEnd);
    const start = current?.end && current.end > new Date() ? current.end : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + SEASON_PASS_MONTHS);
    await db
      .update(subscriptions)
      .set({ status: "active", currentPeriodStart: start, currentPeriodEnd: end })
      .where(eq(subscriptions.id, row.subscriptionId));
  }
  await recomputePlan(row.userId);
  track(row.userId, "payment_captured", { amount_inr: row.amountPaise / 100 });
}

async function onSubscriptionEvent(event: RazorpayEvent, raw: unknown) {
  const remote = event.payload.subscription?.entity;
  if (!remote) return;
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, remote.id))
    .limit(1);
  if (!row) {
    logger.warn({ subscriptionId: remote.id }, "Webhook for unknown subscription");
    return;
  }

  const status =
    event.event === "subscription.cancelled"
      ? ("cancelled" as const)
      : event.event === "subscription.completed"
        ? ("expired" as const)
        : event.event === "subscription.halted"
          ? ("past_due" as const)
          : ("active" as const);

  await db
    .update(subscriptions)
    .set({
      status,
      currentPeriodStart: fromUnix(remote.current_start) ?? row.currentPeriodStart,
      currentPeriodEnd: fromUnix(remote.current_end) ?? row.currentPeriodEnd,
      ...(status === "cancelled" && !row.cancelledAt && { cancelledAt: new Date() }),
    })
    .where(eq(subscriptions.id, row.id));

  const payment = event.payload.payment?.entity;
  if (event.event === "subscription.charged" && payment) {
    await db
      .insert(payments)
      .values({
        userId: row.userId,
        subscriptionId: row.id,
        razorpayOrderId: payment.order_id ?? remote.id,
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount ?? 0,
        status: "captured",
        method: payment.method ?? null,
        raw,
      })
      .onConflictDoNothing({ target: payments.razorpayPaymentId });
  }
  await recomputePlan(row.userId);
}

export async function handleRazorpayEvent(event: RazorpayEvent, eventId: string | undefined) {
  if (!(await firstDelivery(eventId))) return;

  switch (event.event) {
    case "payment.captured":
      if (event.payload.payment) await onPaymentCaptured(event.payload.payment.entity, event);
      break;
    case "payment.failed":
      if (event.payload.payment?.entity.order_id) {
        await db
          .update(payments)
          .set({ status: "failed", raw: event })
          .where(eq(payments.razorpayOrderId, event.payload.payment.entity.order_id));
      }
      break;
    case "refund.processed": {
      const paymentId = event.payload.refund?.entity.payment_id;
      if (paymentId)
        await db.update(payments).set({ status: "refunded" }).where(eq(payments.razorpayPaymentId, paymentId));
      break;
    }
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.halted":
      await onSubscriptionEvent(event, event);
      break;
    default:
      logger.info({ event: event.event }, "Ignored Razorpay event");
  }
}
