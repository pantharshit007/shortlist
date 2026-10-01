import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ShieldCheckIcon, UploadCloudIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AtsReport } from '@/components/ats/ats-report'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ApiError, api, errorMessage, unwrap } from '@/lib/api/client'
import { useSession } from '@/lib/auth-client'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

const minChars = 200
const maxChars = 50_000
const maxJobChars = 20_000

const title = `Free ATS resume checker | ${site.name}`
const description =
  'Check how well a typical applicant tracking system and a recruiter will read your resume. Free score out of 100 with concrete fixes. Nothing is stored.'

const faqs = [
  {
    q: 'What is an ATS?',
    a: 'An applicant tracking system is the software companies use to collect applications. It reads your resume into fields like name, experience and skills so recruiters can search and filter candidates. If it cannot read part of your resume, that part may never reach a person.',
  },
  {
    q: 'Is this the score employers see?',
    a: 'No. There is no universal ATS score. Every company uses different software, set up in its own way, and most never score resumes automatically. This score estimates how cleanly a typical ATS can read your resume and how easy it is for a recruiter to scan, so you know what to fix.',
  },
  {
    q: 'Will you keep my resume?',
    a: 'No. A PDF is read in your browser and only its text is sent to be checked. The text is scored and then discarded, and nothing is saved to an account.',
  },
  {
    q: 'Why does my PDF show no text?',
    a: 'It was probably scanned or exported as an image. Most ATS software cannot read those either. Export the PDF again from Word, Google Docs or LaTeX so the text can be selected, or paste the text instead.',
  },
  {
    q: 'How is the score worked out?',
    a: 'With fixed rules, not AI, so the same resume always gets the same score. It looks at things like contact details, standard section headings, bullet length, numbers in your bullets and overall length. Add a job description to also see which of its keywords your resume is missing.',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}

export const Route = createFileRoute('/_site/ats-checker')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `${site.url}/ats-checker` },
    ],
    links: [{ rel: 'canonical', href: `${site.url}/ats-checker` }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(structuredData),
      },
    ],
  }),
  component: AtsCheckerPage,
})

// Same loading as PdfPages: pdf.js and its worker only load when someone picks a file.
async function pdfText(file: File) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  try {
    const doc = await task.promise
    const pages: string[] = []
    for (let number = 1; number <= doc.numPages; number++) {
      const page = await doc.getPage(number)
      const { items } = await page.getTextContent()
      pages.push(
        items
          .map((item) =>
            'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '',
          )
          .join(''),
      )
    }
    return pages.join('\n\n').trim()
  } finally {
    await task.destroy()
  }
}

function checkError(error: unknown) {
  if (error instanceof ApiError && error.status === 429)
    return 'You have run a lot of checks in a short time. Wait about 10 minutes and try again.'
  return errorMessage(error)
}

function AtsCheckerPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'pdf' | 'text'>('pdf')
  const [file, setFile] = useState<{ name: string; text: string } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pasted, setPasted] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const reportHeading = useRef<HTMLHeadingElement>(null)

  const text = (tab === 'pdf' ? (file?.text ?? '') : pasted).trim()
  const pastedError =
    tab === 'text' && pasted.trim() && text.length < minChars
      ? `Paste the whole resume. This is ${text.length} characters; the check needs at least ${minChars}.`
      : text.length > maxChars
        ? `That is longer than ${maxChars.toLocaleString('en-IN')} characters. Paste only the resume.`
        : null

  const check = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/v1/ats-reports', {
          body: {
            text,
            ...(jobDescription.trim() && {
              jobDescription: jobDescription.trim(),
            }),
          },
        }),
      ),
  })

  useEffect(() => {
    if (check.data) reportHeading.current?.focus()
  }, [check.data])

  async function pickFile(next: File | undefined) {
    if (!next) return
    setFileError(null)
    setFile(null)
    if (next.type !== 'application/pdf' && !/\.pdf$/i.test(next.name)) {
      setFileError('Choose a PDF file, or paste your resume as text instead.')
      return
    }
    setReading(true)
    try {
      const extracted = await pdfText(next)
      if (extracted.length < minChars) {
        setFileError(
          'We could not find text in this PDF. It may be scanned or saved as an image, which most ATS software cannot read either. Export it again from Word, Google Docs or LaTeX, or paste the text instead.',
        )
        return
      }
      setFile({ name: next.name, text: extracted })
    } catch {
      setFileError(
        'We could not open this PDF. It may be damaged or password protected. Try another file, or paste the text instead.',
      )
    } finally {
      setReading(false)
    }
  }

  const importRedirect = '/resumes/new?source=upload'

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 lg:pt-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Free ATS resume checker
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          See how well a typical applicant tracking system and a recruiter's
          quick scan will read your resume, with a list of concrete fixes. No
          sign up needed.
        </p>
      </div>

      <form
        className="mt-10 flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.length >= minChars && !pastedError) check.mutate()
        }}
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList aria-label="How to add your resume">
            <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
            <TabsTrigger value="text">Paste text</TabsTrigger>
          </TabsList>
          <TabsContent value="pdf" className="mt-2 flex flex-col gap-2">
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                pickFile(event.dataTransfer.files[0])
              }}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragging && 'border-primary bg-primary/5',
              )}
            >
              <UploadCloudIcon
                aria-hidden
                className="size-8 text-muted-foreground"
              />
              <p aria-live="polite">
                {reading ? (
                  <span className="text-muted-foreground">
                    Reading your PDF…
                  </span>
                ) : file ? (
                  <>
                    <span className="font-medium break-all">{file.name}</span>{' '}
                    <span className="text-muted-foreground">
                      ({file.text.split(/\s+/).length} words found)
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Drop your resume PDF here, or choose a file
                  </span>
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={reading}
                onClick={() => fileInput.current?.click()}
              >
                {reading && <Spinner data-icon="inline-start" />}
                {file ? 'Choose a different file' : 'Choose PDF'}
              </Button>
              <input
                ref={fileInput}
                type="file"
                aria-label="Choose a resume PDF"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(event) => {
                  pickFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
            <FieldError>{fileError}</FieldError>
          </TabsContent>
          <TabsContent value="text" className="mt-2">
            <Field data-invalid={Boolean(pastedError)}>
              <FieldLabel htmlFor="resume-text">Resume text</FieldLabel>
              <Textarea
                id="resume-text"
                rows={10}
                placeholder="Copy everything from your resume and paste it here"
                value={pasted}
                aria-invalid={Boolean(pastedError)}
                onChange={(event) => setPasted(event.target.value)}
              />
              {pastedError ? (
                <FieldError>{pastedError}</FieldError>
              ) : (
                <FieldDescription>
                  Plain text is fine. Keep the section headings.
                </FieldDescription>
              )}
            </Field>
          </TabsContent>
        </Tabs>

        <Field>
          <FieldLabel htmlFor="job-description">
            Job description (optional)
          </FieldLabel>
          <Textarea
            id="job-description"
            rows={5}
            maxLength={maxJobChars}
            placeholder="Paste a job description to see which of its keywords you are missing"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="sm:self-start"
            disabled={
              check.isPending ||
              reading ||
              text.length < minChars ||
              Boolean(pastedError)
            }
          >
            {check.isPending && <Spinner data-icon="inline-start" />}
            {check.isPending ? 'Checking…' : 'Check my resume'}
          </Button>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            Your PDF is read in your browser. Only its text is sent, checked and
            not stored.
          </p>
          {check.isError && (
            <p role="alert" className="text-sm text-destructive">
              {checkError(check.error)}
            </p>
          )}
        </div>
      </form>

      {check.data && (
        <section aria-labelledby="ats-result" className="mt-12">
          <h2
            id="ats-result"
            ref={reportHeading}
            tabIndex={-1}
            className="mb-6 text-2xl font-semibold tracking-tight outline-none"
          >
            Your ATS report
          </h2>
          <div className="rounded-2xl border bg-card p-5 sm:p-7">
            <AtsReport report={check.data} />
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border bg-muted/40 p-6 sm:flex-row sm:items-center sm:p-7">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="font-sans text-lg font-semibold">
                Fix these in Shortlist
              </h3>
              <p className="text-muted-foreground">
                Import this resume and the AI fixes these issues using only what
                is already in it. You approve every change, and it comes out
                typeset like LaTeX. Free to start.
              </p>
            </div>
            <Button size="lg" asChild>
              {session ? (
                <Link to="/resumes/new" search={{ source: 'upload' }}>
                  Import my resume
                </Link>
              ) : (
                <Link
                  to="/login"
                  search={{ mode: 'signup', redirect: importRedirect }}
                >
                  Fix these in Shortlist
                </Link>
              )}
            </Button>
          </div>
        </section>
      )}

      <section
        aria-labelledby="ats-faq"
        className="mt-24 grid gap-10 lg:-mx-24 lg:grid-cols-[1fr_1.4fr]"
      >
        <h2 id="ats-faq" className="text-3xl font-semibold tracking-tight">
          Questions about ATS checks
        </h2>
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left font-sans text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}
