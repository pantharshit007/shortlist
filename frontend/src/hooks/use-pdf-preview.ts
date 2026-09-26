import { useEffect, useRef, useState } from 'react'
import type { ResumeContent } from '@/lib/api/types'
import { apiUrl } from '@/lib/env'

export type CompileError = {
  line: number | null
  message: string
  hint?: string
}

type PreviewInput =
  { content: ResumeContent; templateId: string } | { texSource: string } | null

type PreviewState = {
  url: string | null
  pageCount: number | null
  errors: CompileError[] | null
  loading: boolean
  failed: string | null
}

// Compiles the current editor state to a PDF, debounced, keeping the last good PDF on screen.
export function usePdfPreview(input: PreviewInput, delay = 700) {
  const [state, setState] = useState<PreviewState>({
    url: null,
    pageCount: null,
    errors: null,
    loading: false,
    failed: null,
  })
  const key = input ? JSON.stringify(input) : null
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!key) return
    const timer = setTimeout(async () => {
      controller.current?.abort()
      const abort = new AbortController()
      controller.current = abort
      setState((s) => ({ ...s, loading: true, failed: null }))
      try {
        const response = await fetch(`${apiUrl}/v1/previews`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: key,
          signal: abort.signal,
        })
        if (response.ok) {
          const url = URL.createObjectURL(await response.blob())
          const pageCount = Number(response.headers.get('x-page-count')) || null
          setState((s) => {
            if (s.url) URL.revokeObjectURL(s.url)
            return {
              url,
              pageCount,
              errors: null,
              loading: false,
              failed: null,
            }
          })
          return
        }
        const body = (await response.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string; details?: CompileError[] }
        }
        if (body.error?.code === 'COMPILE_FAILED') {
          setState((s) => ({
            ...s,
            errors: body.error?.details ?? [],
            loading: false,
          }))
        } else {
          setState((s) => ({
            ...s,
            loading: false,
            failed: body.error?.message ?? 'Preview failed',
          }))
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setState((s) => ({
            ...s,
            loading: false,
            failed: 'Could not reach the server for a preview',
          }))
        }
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [key, delay])

  useEffect(() => () => controller.current?.abort(), [])
  return state
}
