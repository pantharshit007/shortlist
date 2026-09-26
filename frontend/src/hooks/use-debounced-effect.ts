import { useEffect, useRef } from 'react'

// Runs `effect` once `deps` have stopped changing for `delay` ms.
export function useDebouncedEffect(
  effect: () => void,
  deps: unknown[],
  delay: number,
) {
  const latest = useRef(effect)
  latest.current = effect
  useEffect(() => {
    const timer = setTimeout(() => latest.current(), delay)
    return () => clearTimeout(timer)
  }, [...deps, delay])
}
