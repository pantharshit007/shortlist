import { CheckIcon } from 'lucide-react'
import { useState } from 'react'
import {
  CategoryFilter,
  LoadMore,
  useLoadMore,
} from '@/components/templates/template-filters'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { TemplatePreview } from '@/components/templates/template-preview'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { inCategory, templateCatalog } from '@/lib/templates'
import type { TemplateCategory } from '@/lib/templates'
import { cn } from '@/lib/utils'

export type PickerOption = {
  value: string
  name: string
  note?: string
  categories?: readonly string[]
  preview: React.ReactNode
}

// Two rows of the four-column picker.
const pickerBatch = 8

export function layoutOptions(): PickerOption[] {
  return templateCatalog.map((template) => ({
    value: template.id,
    name: template.name,
    categories: template.categories,
    preview: (
      <img
        src={`/templates/${template.id}.png`}
        alt=""
        width={1020}
        height={1320}
        loading="lazy"
        className="aspect-17/22 w-full rounded-sm bg-sheet object-cover object-top"
      />
    ),
  }))
}

export function TemplatePicker({
  value,
  onChange,
  options,
  description,
  footer,
  previews = true,
}: {
  value: string
  onChange: (value: string) => void
  options: PickerOption[]
  description: string
  footer?: React.ReactNode
  // Off inside a popover: the preview dialog would close the popover and itself with it.
  previews?: boolean
}) {
  const [category, setCategory] = useState<TemplateCategory>()
  // Blank page and custom templates have no categories, so they only show under All.
  const filtered = options.filter((option) =>
    inCategory({ categories: option.categories ?? [] }, category),
  )
  const index = filtered.findIndex((option) => option.value === value)
  const { limit, listRef, more } = useLoadMore<HTMLDivElement>(
    pickerBatch,
    category,
    index + 1,
  )
  // A selection outside the filter stays pinned first, so it's never hidden.
  const pinned =
    index < 0 ? options.find((option) => option.value === value) : undefined
  const shown = pinned
    ? [pinned, ...filtered.slice(0, limit - 1)]
    : filtered.slice(0, limit)
  const total = filtered.length + (pinned ? 1 : 0)

  return (
    <FieldSet>
      <FieldLegend>Template</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <CategoryFilter value={category} onChange={setCategory} />
      <ToggleGroup
        ref={listRef}
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next)}
        aria-label="Template"
        className="grid w-full grid-cols-2 gap-4 @xl:grid-cols-4"
      >
        {shown.map((option) => {
          const selected = option.value === value
          return (
            <div key={option.value} className="group/card relative flex">
              <ToggleGroupItem
                value={option.value}
                aria-label={option.name}
                className="group flex h-auto w-full flex-col items-stretch justify-start gap-2 rounded-lg p-1.5 text-left whitespace-normal data-[state=on]:bg-primary/10"
              >
                <span
                  className={cn(
                    'relative block overflow-hidden rounded-sm ring-1 ring-black/10 transition-shadow',
                    selected
                      ? 'ring-2 ring-primary'
                      : 'group-hover:ring-foreground/30',
                  )}
                >
                  {option.preview}
                  {selected && (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-4" />
                    </span>
                  )}
                </span>
                <span className="flex flex-col px-0.5">
                  <span className="truncate text-sm font-medium">
                    {option.name}
                  </span>
                  {option.note && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {option.note}
                    </span>
                  )}
                </span>
              </ToggleGroupItem>
              {previews && (
                <TemplatePreview
                  templateId={option.value}
                  onUse={() => onChange(option.value)}
                  className="absolute right-3 bottom-12 z-10"
                />
              )}
            </div>
          )
        })}
      </ToggleGroup>
      {total > pickerBatch && (
        <LoadMore shown={limit} total={total} onClick={more} />
      )}
      {footer}
    </FieldSet>
  )
}
