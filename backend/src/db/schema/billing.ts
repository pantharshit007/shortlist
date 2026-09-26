import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { timestamps } from "./columns.js";

export const subscriptionPlan = pgEnum("subscription_plan", ["season_pass", "pro"]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "created",
  "active",
  "past_due",
  "cancelled",
  "expired",
]);

// A paid plan. Season Pass is a one-time payment covering 6 months;
// Pro is a monthly Razorpay subscription.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlan().notNull(),
    status: subscriptionStatus().notNull().default("created"),
    razorpaySubscriptionId: text().unique(),
    currentPeriodStart: timestamp({ withTimezone: true }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const paymentStatus = pgEnum("payment_status", [
  "created",
  "captured",
  "failed",
  "refunded",
]);

// Each Razorpay transaction, for receipts, refunds and support.
export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: uuid().references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    razorpayOrderId: text().notNull(),
    razorpayPaymentId: text().unique(),
    amountPaise: integer().notNull(),
    currency: text().notNull().default("INR"),
    status: paymentStatus().notNull().default("created"),
    method: text(), // upi, card, netbanking, ...
    // Latest webhook payload from Razorpay, kept for debugging.
    raw: jsonb(),
    ...timestamps,
  },
  (t) => [index().on(t.userId), index().on(t.razorpayOrderId)],
);
