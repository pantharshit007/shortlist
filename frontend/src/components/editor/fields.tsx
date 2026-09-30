import { LockIcon, LockOpenIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Sensitive values are replaced with placeholders before anything is sent to an AI model.
export function SensitiveToggle({
  label,
  pressed,
  onPressedChange,
  className,
}: {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          aria-label={`Hide ${label} from AI`}
          pressed={pressed}
          onPressedChange={onPressedChange}
          className={cn(
            'text-muted-foreground aria-pressed:text-foreground',
            className,
          )}
        >
          {pressed ? <LockIcon /> : <LockOpenIcon />}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        {pressed ? 'Hidden from AI' : 'Hide from AI'}
      </TooltipContent>
    </Tooltip>
  )
}

type InputPassthrough = Pick<
  React.ComponentProps<typeof Input>,
  'autoComplete' | 'inputMode' | 'spellCheck' | 'name' | 'autoCapitalize'
>

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  sensitive,
  onSensitiveChange,
  ...inputProps
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  type?: string
  className?: string
  sensitive?: boolean
  onSensitiveChange?: (sensitive: boolean) => void
} & InputPassthrough) {
  return (
    <Field className={className}>
      {onSensitiveChange ? (
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <SensitiveToggle
            label={label.toLowerCase()}
            pressed={sensitive ?? false}
            onPressedChange={onSensitiveChange}
            className="-my-1"
          />
        </div>
      ) : (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      )}
      <Input
        id={id}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        {...inputProps}
        onChange={(event) =>
          onChange(event.target.value === '' ? undefined : event.target.value)
        }
      />
    </Field>
  )
}

// Stored as "YYYY" or "YYYY-MM"; a month input needs "YYYY-MM".
const toMonth = (value: string | undefined) =>
  value && /^\d{4}$/.test(value) ? `${value}-01` : (value ?? '')

export function MonthField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="month"
        value={toMonth(value)}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </Field>
  )
}

export function EndDateField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const present = value === 'present'
  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>End</FieldLabel>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox
            checked={present}
            onCheckedChange={(checked) =>
              onChange(checked === true ? 'present' : undefined)
            }
          />
          Present
        </label>
      </div>
      <Input
        id={id}
        type="month"
        disabled={present}
        value={present ? '' : toMonth(value)}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </Field>
  )
}

export function ListField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hideLabel = false,
}: {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  hideLabel?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        defaultValue={value.join(', ')}
        placeholder={placeholder}
        onBlur={(event) =>
          onChange(
            event.target.value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
      />
    </Field>
  )
}
