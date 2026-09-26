import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  template: z.string().optional(),
  source: z.enum(['blank', 'profile', 'upload', 'tex']).optional(),
})

export const Route = createFileRoute('/_app/resumes/new')({
  validateSearch: searchSchema,
  component: () => null,
})
