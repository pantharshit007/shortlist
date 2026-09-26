import { useBlocker } from '@tanstack/react-router'
import { ConfirmDialog } from './confirm-dialog'

// Asks before leaving the page (in-app navigation or closing the tab) while changes are unsaved.
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: () => when,
    withResolver: true,
  })
  return (
    <ConfirmDialog
      open={blocker.status === 'blocked'}
      onOpenChange={(open) =>
        !open && blocker.status === 'blocked' && blocker.reset()
      }
      title="Leave without saving?"
      description="Your latest changes haven't saved yet. Stay a few seconds and they will."
      confirmLabel="Leave anyway"
      cancelLabel="Stay"
      destructive
      onConfirm={() => blocker.status === 'blocked' && blocker.proceed()}
    />
  )
}
