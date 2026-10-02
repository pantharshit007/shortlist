import { ApiError } from '@/lib/api/client'
import { apiUrl } from '@/lib/env'

// Fetches a file from the API with the session cookie, turning an error body into an ApiError.
export async function fetchFile(path: string) {
  const response = await fetch(`${apiUrl}${path}`, { credentials: 'include' })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string; details?: unknown }
    }
    throw new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Download failed',
      body.error?.details,
    )
  }
  return response
}

// Hands a file from the API to the browser as a download.
export async function downloadFile(path: string, fallbackName: string) {
  const response = await fetchFile(path)
  const disposition = response.headers.get('content-disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName
  saveBlob(await response.blob(), name)
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
