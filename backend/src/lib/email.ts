import { env } from "../config/env.js";
import { AppError } from "./errors.js";
import { logger } from "./logger.js";

type Email = { to: string; subject: string; html: string; text: string };

export async function sendEmail(email: Email) {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Email sending is not configured");
    }
    // Without a key in development, print the email so links can be clicked from the terminal.
    logger.info({ to: email.to, subject: email.subject, text: email.text }, "Email not sent (no RESEND_API_KEY)");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...email }),
  });

  if (!response.ok) {
    logger.error({ status: response.status, body: await response.text() }, "Resend request failed");
    throw new AppError(502, "EMAIL_FAILED", "Could not send email");
  }
}
