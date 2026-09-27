// Storage can be blocked (private windows, strict settings); fall back to not remembering.
export const panelStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Sizes just won't be remembered.
    }
  },
}
