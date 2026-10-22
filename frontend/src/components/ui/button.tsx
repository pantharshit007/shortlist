import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate,filter] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Tactile buttons: a soft top-lit gradient, a light inner edge, a crisp darker rim and a small shadow
        // that flattens when pressed. Built on the theme tokens, so they follow light and dark mode.
        default:
          'border-[color-mix(in_oklch,var(--primary),black_22%)] bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--primary),white_10%),var(--primary))] text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.16),0_3px_8px_-3px_color-mix(in_oklch,var(--primary),transparent_40%)] hover:brightness-[1.06] active:shadow-[inset_0_1px_3px_rgb(0_0_0/0.22)]',
        outline:
          'border-border bg-[linear-gradient(to_bottom,var(--card),var(--background))] shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(0_0_0/0.07)] hover:brightness-[0.98] hover:text-foreground active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] aria-expanded:text-foreground dark:border-input dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)] dark:hover:brightness-[1.12]',
        secondary:
          'border-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)] bg-[linear-gradient(to_bottom,var(--card),var(--secondary))] text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(0_0_0/0.07)] hover:brightness-[0.98] active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] aria-expanded:text-secondary-foreground dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)] dark:hover:brightness-[1.12]',
        // Frosted glass: a translucent paper sheen with a bright top edge, blurring whatever sits behind it.
        glass:
          'border-[color-mix(in_oklch,var(--card),transparent_20%)] bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--card),transparent_25%),color-mix(in_oklch,var(--card),transparent_65%))] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.75),0_1px_2px_rgb(0_0_0/0.06),0_6px_16px_-6px_rgb(0_0_0/0.12)] ring-1 ring-black/5 backdrop-blur-md hover:brightness-[1.03] active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] dark:border-white/15 dark:bg-[linear-gradient(to_bottom,rgb(255_255_255/0.10),rgb(255_255_255/0.04))] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.4)] dark:ring-0 dark:hover:brightness-[1.15]',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
