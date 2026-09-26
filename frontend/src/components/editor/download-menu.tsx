import { ChevronDownIcon, DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { errorMessage } from '@/lib/api/client'
import { downloadFile } from '@/lib/download'

export function DownloadMenu({
  resumeId,
  title,
  structured,
}: {
  resumeId: string
  title: string
  structured: boolean
}) {
  async function download(path: string, extension: string) {
    try {
      await downloadFile(
        `/v1/resumes/${resumeId}/${path}`,
        `${title.trim() || 'resume'}.${extension}`,
      )
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <DownloadIcon data-icon="inline-start" />
          Download
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => download('pdf?download=true', 'pdf')}
          >
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => download('tex', 'tex')}>
            LaTeX source (.tex)
          </DropdownMenuItem>
          {structured && (
            <DropdownMenuItem onSelect={() => download('json-resume', 'json')}>
              JSON Resume
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
