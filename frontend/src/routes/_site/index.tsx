import { Link, createFileRoute } from '@tanstack/react-router'
import { HeroDemo } from '@/components/landing/hero-demo'
import {
  EditModes,
  Faq,
  FinalCta,
  HonestAi,
  HowItWorks,
  ShareSection,
  TemplatesShowcase,
} from '@/components/landing/sections'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_site/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 pt-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div>
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            Your resume, rewritten for every job you apply to
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Paste a job description and get a tailored version of your resume in
            under a minute. Every change is highlighted for you to accept or
            skip. It looks typeset in LaTeX, and you never have to touch LaTeX.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/login" search={{ mode: 'signup' }}>
                Build my resume
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/templates">See templates</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Unlimited resumes, free. No card needed.
          </p>
        </div>
        <HeroDemo />
      </section>
      <HowItWorks />
      <EditModes />
      <HonestAi />
      <TemplatesShowcase />
      <ShareSection />
      <Faq />
      <FinalCta />
    </>
  )
}
