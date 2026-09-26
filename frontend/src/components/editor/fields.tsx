import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
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
}: {
  id: string
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
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
