import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined

// Page views, web analytics and session replay. Recordings mask all text and inputs, because
// resumes appear as plain text in the editor and on share pages. Empty key: nothing is sent.
export function initAnalytics() {
  if (!key || typeof window === 'undefined' || posthog.__loaded) return
  posthog.init(key, {
    api_host:
      (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
      'https://us.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    mask_all_text: true,
    session_recording: { maskAllInputs: true, maskTextSelector: '*' },
    // Load, interaction and layout-shift timings as real visitors experience them, not just server time.
    capture_performance: { web_vitals: true },
  })
}

export function track(event: string, properties: Record<string, unknown>) {
  if (key) posthog.capture(event, properties)
}

// The backend sends product events under the same user id, so they join this person's page views.
export function identifyUser(userId: string) {
  if (key) posthog.identify(userId)
}

export function resetAnalytics() {
  if (key) posthog.reset()
}
