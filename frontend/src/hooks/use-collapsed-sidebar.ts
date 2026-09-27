import { useEffect } from 'react'
import { useSidebar } from '@/components/ui/sidebar'

// Editors need the full width; collapse the app sidebar while one is open.
export function useCollapsedSidebar() {
  const { setOpen } = useSidebar()
  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [setOpen])
}
