import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { move, newId } from './content-helpers'
import type { Bullet } from './content-helpers'

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: Bullet[]
  onChange: (bullets: Bullet[]) => void
}) {
  const update = (index: number, patch: Partial<Bullet>) =>
    onChange(
      bullets.map((bullet, i) =>
        i === index ? { ...bullet, ...patch } : bullet,
      ),
    )

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        Bullet points{' '}
        <span className="font-normal text-muted-foreground">
          Wrap words in **double asterisks** to make them bold.
        </span>
      </p>
      {bullets.map((bullet, index) => (
        <div key={bullet.id} className="group flex items-start gap-1.5">
          <span className="mt-2.5 text-muted-foreground" aria-hidden="true">
            •
          </span>
          <Textarea
            aria-label={`Bullet ${index + 1}`}
            value={bullet.text}
            rows={2}
            placeholder="Built X using Y, which improved Z by N%"
            className={cn(
              'min-h-0 resize-none field-sizing-content',
              bullet.hidden && 'opacity-50',
            )}
            onChange={(event) => update(index, { text: event.target.value })}
          />
          <div className="flex shrink-0 flex-col opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:flex-row">
            <IconAction
              label="Move up"
              onClick={() => onChange(move(bullets, index, -1))}
            >
              <ArrowUpIcon />
            </IconAction>
            <IconAction
              label="Move down"
              onClick={() => onChange(move(bullets, index, 1))}
            >
              <ArrowDownIcon />
            </IconAction>
            <IconAction
              label={bullet.hidden ? 'Show on resume' : 'Hide from resume'}
              onClick={() => update(index, { hidden: !bullet.hidden })}
            >
              {bullet.hidden ? <EyeOffIcon /> : <EyeIcon />}
            </IconAction>
            <IconAction
              label="Remove"
              onClick={() => onChange(bullets.filter((_, i) => i !== index))}
            >
              <XIcon />
            </IconAction>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([...bullets, { id: newId(), text: '', hidden: false }])
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add bullet
      </Button>
    </div>
  )
}
