import { Link } from '@tanstack/react-router'
import { EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { templateCatalog } from '@/lib/templates'
import { cn } from '@/lib/utils'

// A thumbnail is too small to judge a layout by; this opens the template full size before choosing it.
// With onUse it picks the template in place, otherwise "Use this template" starts a new resume with it.
export function TemplatePreview({
  templateId,
  onUse,
  className,
}: {
  templateId: string
  onUse?: () => void
  className?: string
}) {
  const template = templateCatalog.find((t) => t.id === templateId)
  if (!template) return null
  const use = <Button onClick={onUse}>Use this template</Button>
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          aria-label={`Preview ${template.name}`}
          className={cn('shadow-sm', className)}
        >
          <EyeIcon data-icon="inline-start" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] gap-4 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        <img
          src={`/templates/${template.id}.png`}
          alt={`${template.name} template with a sample resume`}
          width={1020}
          height={1320}
          className="w-full rounded-sm bg-sheet shadow-sm ring-1 ring-black/10"
        />
        <DialogFooter>
          {onUse ? (
            <DialogClose asChild>{use}</DialogClose>
          ) : (
            <Button asChild>
              <Link to="/resumes/new" search={{ template: template.id }}>
                Use this template
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
