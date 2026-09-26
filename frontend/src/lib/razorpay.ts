type RazorpayOptions = {
  key: string
  name: string
  description: string
  order_id?: string
  subscription_id?: string
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  handler: () => void
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

let loading: Promise<void> | null = null

function loadScript() {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => {
      loading = null
      reject(
        new Error(
          'Could not load the payment window. Check your connection and try again.',
        ),
      )
    }
    document.body.appendChild(script)
  })
  return loading
}

export async function openRazorpayCheckout(options: RazorpayOptions) {
  await loadScript()
  if (!window.Razorpay)
    throw new Error('The payment window is unavailable. Try again.')
  new window.Razorpay(options).open()
}
