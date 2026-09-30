import { PostHog } from "posthog-node";
import { env } from "../config/env.js";

// Product events and API timings for PostHog. Send ids, counts and choices only: never resume
// content, emails, names or anything a user typed.
const client = env.POSTHOG_KEY ? new PostHog(env.POSTHOG_KEY, { host: env.POSTHOG_HOST }) : null;

type Properties = Record<string, string | number | boolean | null>;

// An action a signed-in user took. The frontend identifies with the same user id, so these join their page views.
export function track(userId: string, event: string, properties: Properties = {}) {
  client?.capture({ distinctId: userId, event, properties });
}

// Server-side measurements that belong to no person.
export function trackServer(event: string, properties: Properties) {
  client?.capture({
    distinctId: "shortlist-api",
    event,
    properties: { ...properties, $process_person_profile: false },
  });
}

export async function flushAnalytics() {
  await client?.shutdown();
}
