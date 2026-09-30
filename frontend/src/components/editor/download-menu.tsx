import { ChevronDownIcon, DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Download
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Save as PDF, LaTeX or JSON</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {[
            {
              path: 'pdf?download=true',
              extension: 'pdf',
              label: 'PDF',
              hint: 'Ready to send or upload to job portals',
            },
            {
              path: 'tex',
              extension: 'tex',
              label: 'LaTeX source (.tex)',
              hint: 'Keep editing it on Overleaf',
            },
            ...(structured
              ? [
                  {
                    path: 'json-resume',
                    extension: 'json',
                    label: 'JSON Resume',
                    hint: 'Your data in an open format for other tools',
                  },
                ]
              : []),
          ].map((option) => (
            <DropdownMenuItem
              key={option.path}
              onSelect={() => download(option.path, option.extension)}
              className="flex-col items-start gap-0"
            >
              {option.label}
              <span className="text-xs text-muted-foreground">
                {option.hint}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
