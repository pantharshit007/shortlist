import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  tab: z.enum(['account', 'billing', 'data']).optional(),
  plan: z.enum(['season_pass', 'pro']).optional(),
})

export const Route = createFileRoute('/_app/settings')({
  validateSearch: searchSchema,
  component: () => null,
})
