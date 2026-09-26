import createClient from 'openapi-fetch'
import { apiUrl } from '@/lib/env'
import type { paths } from './schema'

export const api = createClient<paths>({
  baseUrl: apiUrl,
  credentials: 'include',
})

type ErrorBody = {
  error?: { code?: string; message?: string; details?: unknown }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Turns openapi-fetch's { data, error } into the payload or a thrown ApiError.
export async function unwrap<T>(
  request: Promise<{ data?: { data: T }; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request
  if (error !== undefined || !data) {
    const body = (error ?? {}) as ErrorBody
    throw new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Something went wrong. Try again.',
      body.error?.details,
    )
  }
  return data.data
}

// For endpoints that answer 204 No Content.
export async function expectOk(
  request: Promise<{ error?: unknown; response: Response }>,
) {
  const { error, response } = await request
  if (!response.ok) {
    const body = (error ?? {}) as ErrorBody
    throw new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Something went wrong.',
    )
  }
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Try again.'
}
