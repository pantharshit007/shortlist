import { Link } from '@tanstack/react-router'
import { CheckIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  inCategory,
  templateCatalog,
  templateCategories,
} from '@/lib/templates'
import type { TemplateCategory } from '@/lib/templates'

// Categories nobody has a template for yet stay out of the chips; a direct link still shows the empty state.
const usedCategories = templateCategories.filter((category) =>
  templateCatalog.some((template) => inCategory(template, category.id)),
)

/** Category chips plus "All". Without onChange the chips link to the public templates page. */
export function CategoryFilter({
  value,
  onChange,
}: {
  value?: TemplateCategory
  onChange?: (value?: TemplateCategory) => void
}) {
  const chips = [{ id: undefined, name: 'All' }, ...usedCategories]
  return (
    <ul aria-label="Filter by field" className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const selected = chip.id === value
        const content = (
          <>
            {selected && <CheckIcon data-icon="inline-start" />}
            {chip.name}
          </>
        )
        return (
          <li key={chip.name}>
            {onChange ? (
              <Button
                type="button"
                size="sm"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                onClick={() => onChange(chip.id)}
              >
                {content}
              </Button>
            ) : (
              <Button
                size="sm"
                variant={selected ? 'default' : 'outline'}
                asChild
              >
                <Link
                  to="/templates"
                  search={chip.id ? { category: chip.id } : {}}
                  resetScroll={false}
                  activeOptions={{ exact: true }}
                >
                  {content}
                </Link>
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Reveals items in batches. Changing resetKey (the filter) goes back to one batch,
 * `minimum` keeps that many items loaded, and focus moves to the first new item.
 */
export function useLoadMore<T extends HTMLElement = HTMLElement>(
  batch: number,
  resetKey: unknown,
  minimum = 0,
) {
  const [state, setState] = useState({ key: resetKey, count: batch })
  const count = state.key === resetKey ? state.count : batch
  const limit = Math.max(count, Math.ceil(minimum / batch) * batch)
  const listRef = useRef<T>(null)
  const focusFrom = useRef<number | null>(null)

  useEffect(() => {
    const from = focusFrom.current
    focusFrom.current = null
    const item = from === null ? null : listRef.current?.children[from]
    if (!(item instanceof HTMLElement)) return
    ;(item.matches('a, button')
      ? item
      : item.querySelector<HTMLElement>('a, button')
    )?.focus()
  }, [limit])

  return {
    limit,
    listRef,
    more: () => {
      focusFrom.current = limit
      setState({ key: resetKey, count: limit + batch })
    },
  }
}

export function LoadMore({
  shown,
  total,
  onClick,
}: {
  shown: number
  total: number
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {Math.min(shown, total)} of {total}
      </p>
      {shown < total && (
        <Button type="button" variant="outline" onClick={onClick}>
          Load more
        </Button>
      )}
    </div>
  )
}
