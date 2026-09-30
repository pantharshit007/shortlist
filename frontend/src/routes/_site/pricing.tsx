import { Link, createFileRoute } from '@tanstack/react-router'
import { CheckIcon, KeyRoundIcon, ShieldCheckIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

// Keep these numbers in step with planLimits in backend/src/modules/usage/quotas.ts.
const plans = [
  {
    id: 'free',
    name: 'Free',
    forWhom: 'Build your resume yourself, with a little AI help.',
    price: '₹0',
    period: null,
    note: 'Free, forever. No card needed.',
    cta: 'Build my resume',
    listTitle: 'Includes:',
    features: [
      'Unlimited resumes you write yourself',
      '3 resumes tailored with AI each month',
      'Every template, in the form or LaTeX editor',
      'PDF downloads and share links',
    ],
  },
  {
    id: 'season_pass',
    name: 'Season Pass',
    forWhom: 'For placement season, when you apply every week.',
    price: '₹499',
    period: '/ 6 months',
    note: 'One payment, about ₹83 a month. Never renews on its own.',
    cta: 'Get the Season Pass',
    featured: true,
    listTitle: 'Everything in Free, plus:',
    features: [
      '40 resumes tailored with AI each month, instead of 3',
      'Unlimited AI rewrites and quick changes (fair use)',
      'Unlimited one-click LaTeX error fixes (fair use)',
      '50 imports a month from PDF, .tex or text files',
      '6 months of access for a single payment',
      'Never renews or charges you again on its own',
      'Your resumes and links stay when the pass ends',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    forWhom: 'For a job search you would rather pay for monthly.',
    price: '₹129',
    period: '/ month',
    note: 'Billed monthly. Cancel anytime.',
    cta: 'Choose Pro',
    listTitle: 'Everything in Free, plus:',
    features: [
      '40 resumes tailored with AI each month, instead of 3',
      'Unlimited AI rewrites and quick changes (fair use)',
      'Unlimited one-click LaTeX error fixes (fair use)',
      '50 imports a month from PDF, .tex or text files',
      'Billed monthly, cancel anytime from Settings',
      'Keep Pro until the end of the month you paid for',
      'Your resumes and links stay if you cancel',
    ],
  },
] as const

const comparison: { label: string; values: [string, string, string] }[] = [
  {
    label: 'Resumes you write yourself',
    values: ['Unlimited', 'Unlimited', 'Unlimited'],
  },
  {
    label: 'Resumes tailored with AI',
    values: ['3 a month', '40 a month', '40 a month'],
  },
  {
    label: 'Imports from PDF, .tex or text (uses AI)',
    values: ['3 a month', '50 a month', '50 a month'],
  },
  {
    label: 'AI rewrites, quick changes and LaTeX fixes',
    values: ['50 a month', 'Unlimited (fair use)', 'Unlimited (fair use)'],
  },
  {
    label: 'Templates, form editor and LaTeX editor',
    values: ['All included', 'All included', 'All included'],
  },
  {
    label: 'PDF, .tex and JSON downloads',
    values: ['Included', 'Included', 'Included'],
  },
  {
    label: 'Share links with view analytics',
    values: ['Included', 'Included', 'Included'],
  },
  {
    label: 'Price',
    values: ['Free', '₹499 once, for 6 months', '₹129 a month'],
  },
]

const faqs = [
  {
    q: 'Is the free plan really free?',
    a: 'Yes. Resumes you write yourself are free and unlimited, including every template, downloads and share links. AI features have a monthly allowance, 3 tailored resumes on Free, because each AI request costs us money to run.',
  },
  {
    q: 'What counts as a resume tailored with AI?',
    a: 'Each time you ask the AI to tailor a resume to a job description, it counts as one. Writing and editing by hand, downloading and sharing never count.',
  },
  {
    q: 'What happens when the Season Pass ends?',
    a: 'Your account moves back to Free. Nothing is deleted: your resumes, versions and share links all stay. You just get the free AI limits again.',
  },
  {
    q: 'Can I cancel Pro?',
    a: 'Yes, from Settings. You keep Pro until the end of the month you have paid for.',
  },
  {
    q: 'Can I use my own AI key?',
    a: 'Yes. Add an OpenAI, Anthropic or OpenRouter key in Settings and your AI requests run on it, with no monthly limits from us. You pay the provider directly.',
  },
  {
    q: 'How do I pay?',
    a: 'UPI, cards and net banking through Razorpay. Prices include GST where it applies.',
  },
]

// Product and Offer data so search engines and AI assistants can read the prices.
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: site.name,
  description: site.description,
  offers: [
    { name: 'Free', price: '0' },
    { name: 'Season Pass (6 months)', price: '499' },
    { name: 'Pro (monthly)', price: '129' },
  ].map((offer) => ({
    '@type': 'Offer',
    ...offer,
    priceCurrency: 'INR',
    url: `${site.url}/pricing`,
  })),
}

export const Route = createFileRoute('/_site/pricing')({
  head: () => ({
    meta: [
      { title: `Pricing | ${site.name}` },
      {
        name: 'description',
        content:
          'Build unlimited resumes free. Season Pass ₹499 for six months of AI tailoring, or Pro at ₹129 a month.',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(structuredData),
      },
    ],
  }),
  component: PricingPage,
})

function PlanCta({
  plan,
  className,
}: {
  plan: (typeof plans)[number]
  className?: string
}) {
  const featured = 'featured' in plan && plan.featured
  return (
    <Button
      size="lg"
      variant={featured ? 'default' : 'outline'}
      className={cn('w-full', className)}
      asChild
    >
      {plan.id === 'free' ? (
        <Link to="/login" search={{ mode: 'signup' }}>
          {plan.cta}
        </Link>
      ) : (
        <Link to="/settings" search={{ tab: 'billing', plan: plan.id }}>
          {plan.cta}
        </Link>
      )}
    </Button>
  )
}

function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 lg:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        {/* One sentence per line, so the break never splits "Pay only for more AI help". */}
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          <span className="block">Resumes are free.</span>
          <span className="block">Pay only for more AI help.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Build, edit, download and share as many resumes as you like at no
          cost. Upgrade when you are tailoring one for every application.
        </p>
      </div>

      {/* Cards share row lines (subgrid) so names, prices, buttons and lists align across plans. */}
      <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto_auto_1fr]">
        {plans.map((plan) => {
          const featured = 'featured' in plan && plan.featured
          return (
            <section
              key={plan.id}
              aria-labelledby={`plan-${plan.id}`}
              className={cn(
                'flex flex-col rounded-2xl border bg-card p-7 sm:p-8 lg:row-span-6 lg:grid lg:grid-rows-subgrid lg:gap-y-0',
                featured &&
                  'border-primary/60 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.25)] ring-1 ring-primary/60',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id={`plan-${plan.id}`}
                  className="font-sans text-xl font-semibold"
                >
                  {plan.name}
                </h2>
                {featured && <Badge>Best value</Badge>}
              </div>
              <p className="mt-2 font-serif text-lg text-muted-foreground">
                {plan.forWhom}
              </p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-serif text-5xl font-semibold tracking-tight tabular-nums">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
              <PlanCta plan={plan} className="mt-6" />
              <div className="mt-8 border-t pt-6">
                <p className="text-sm font-medium">{plan.listTitle}</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <CheckIcon
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0 text-primary"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <ShieldCheckIcon
          aria-hidden
          className="mr-2 inline size-4 align-[-3px] text-primary"
        />
        Pay with UPI, cards or net banking through Razorpay
      </p>

      {/* Deliberately quieter than the plan cards: it works on any plan and isn't a plan itself. */}
      <section
        aria-labelledby="own-key"
        className="mt-12 flex flex-col gap-5 rounded-2xl border border-dashed p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-7"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRoundIcon aria-hidden className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id="own-key" className="font-sans text-lg font-semibold">
            Have your own AI key?
          </h2>
          <p className="text-muted-foreground">
            Add an OpenAI, Anthropic or OpenRouter key in Settings and AI
            requests run on your key, with no monthly limits from us. Works on
            every plan, including Free.
          </p>
          <p className="text-sm text-muted-foreground">
            You pay the provider directly. Your key is encrypted and never shown
            again after you save it.
          </p>
        </div>
        <Button variant="ghost" className="self-start sm:self-center" asChild>
          <Link to="/settings" search={{ tab: 'ai' }}>
            Add your key
          </Link>
        </Button>
      </section>

      <section aria-labelledby="compare" className="mt-24">
        <h2
          id="compare"
          className="text-center text-3xl font-semibold tracking-tight"
        >
          Compare plans
        </h2>
        <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
          <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">
                  <span className="sr-only">Feature</span>
                </TableHead>
                {plans.map((plan) => (
                  <TableHead
                    key={plan.id}
                    className={cn(
                      'font-semibold text-foreground',
                      plan.id === 'season_pass' && 'bg-primary/5',
                    )}
                  >
                    {plan.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium whitespace-normal">
                    {row.label}
                  </TableCell>
                  {row.values.map((value, index) => (
                    <TableCell
                      key={plans[index].id}
                      className={cn(
                        'whitespace-normal text-muted-foreground',
                        plans[index].id === 'season_pass' && 'bg-primary/5',
                      )}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section
        aria-labelledby="billing-faq"
        className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]"
      >
        <h2 id="billing-faq" className="text-3xl font-semibold tracking-tight">
          Questions about pricing
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

      <section className="mt-24 flex flex-col items-center gap-5 rounded-2xl border bg-card px-6 py-14 text-center">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
          Start with the free plan. Upgrade when applications pick up.
        </h2>
        <Button size="lg" asChild>
          <Link to="/login" search={{ mode: 'signup' }}>
            Build my resume free
          </Link>
        </Button>
      </section>
    </div>
  )
}
