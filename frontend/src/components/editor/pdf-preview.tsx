import { AlertTriangleIcon, FileWarningIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { CompileError } from '@/hooks/use-pdf-preview'
import { PdfPages } from './pdf-pages'

export function PdfPreview({
  url,
  pageCount,
  pageLimit,
  errors,
  loading,
  failed,
  onErrorClick,
  onFix,
}: {
  url: string | null
  pageCount: number | null
  pageLimit: number
  errors: CompileError[] | null
  loading: boolean
  failed: string | null
  onErrorClick?: (line: number) => void
  onFix?: () => void
}) {
  const over = pageCount !== null && pageCount > pageLimit
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 text-sm">
        <span className="font-medium">Preview</span>
        {pageCount !== null && (
          <Badge variant={over ? 'destructive' : 'secondary'}>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            {over && `, limit ${pageLimit}`}
          </Badge>
        )}
        {loading && (
          <span className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Spinner />
            Updating
          </span>
        )}
      </div>

      {errors && errors.length > 0 && (
        <div className="shrink-0 border-b p-3">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>The LaTeX doesn't compile</AlertTitle>
            <AlertDescription>
              <ul className="flex flex-col gap-1.5">
                {errors.slice(0, 4).map((error, index) => (
                  <li key={index}>
                    {error.line !== null && onErrorClick ? (
                      <button
                        type="button"
                        className="font-medium underline underline-offset-2"
                        onClick={() => onErrorClick(error.line!)}
                      >
                        Line {error.line}
                      </button>
                    ) : null}
                    {error.line !== null && ': '}
                    {error.message}
                    {error.hint && (
                      <span className="block text-foreground/80">
                        {error.hint}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {onFix && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={onFix}
                >
                  Fix it with AI
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative min-h-0 flex-1 bg-muted/60">
        {url ? (
          <div className="size-full overflow-y-auto">
            <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-8">
              <PdfPages url={url} />
            </div>
          </div>
        ) : failed ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <FileWarningIcon className="size-6" />
            <p>{failed}</p>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  )
}
