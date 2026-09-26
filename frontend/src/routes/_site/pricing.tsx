import { Link, createFileRoute } from '@tanstack/react-router'
import { CheckIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_site/pricing')({
  head: () => ({
    meta: [
      { title: `Pricing | ${site.name}` },
      {
        name: 'description',
        content:
          'Free for 3 resumes. Season Pass ₹499 for six months of applications.',
      },
    ],
  }),
  component: PricingPage,
})

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    summary: 'Everything you need for your first few applications.',
    cta: 'Start free',
    features: [
      '3 resumes',
      '5 tailored versions a month',
      '50 AI edits a month',
      'All templates and LaTeX code mode',
      'PDF and .tex downloads',
      'Share links with view counts',
    ],
  },
  {
    id: 'season_pass',
    name: 'Season Pass',
    price: '₹499',
    period: 'for 6 months',
    summary: 'For placement season, when you apply to a new role every day.',
    cta: 'Get the Season Pass',
    featured: true,
    features: [
      'Unlimited resumes',
      '40 tailored versions a month',
      'Unlimited AI edits (fair use)',
      'Everything in Free',
      'One payment, no auto-renewal',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹129',
    period: 'per month',
    summary:
      'The same limits as the Season Pass, billed monthly. Cancel anytime.',
    cta: 'Go Pro',
    features: [
      'Unlimited resumes',
      '40 tailored versions a month',
      'Unlimited AI edits (fair use)',
      'Everything in Free',
    ],
  },
] as const

const faqs = [
  {
    q: 'How do I pay?',
    a: 'UPI, cards and net banking through Razorpay. Prices include GST where it applies.',
  },
  {
    q: 'What happens when the Season Pass ends?',
    a: 'Your account moves back to Free. Nothing is deleted: all your resumes, versions and links stay, you just get the free limits again.',
  },
  {
    q: 'Can I cancel Pro?',
    a: 'Yes, from Settings. You keep Pro until the end of the month you have paid for.',
  },
  {
    q: 'What counts as a tailored version?',
    a: 'Each time you ask us to tailor a resume to a job description. Editing, downloading and sharing are never limited.',
  },
]

function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 lg:pt-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Pay only when you are applying a lot
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Editing, downloading and sharing are free and unlimited. Plans only
          raise how many tailored versions you can make.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const featured = 'featured' in plan && plan.featured
          return (
            <section
              key={plan.id}
              aria-labelledby={`plan-${plan.id}`}
              className={cn(
                'flex flex-col rounded-xl border bg-card p-7',
                featured && 'border-primary ring-1 ring-primary',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id={`plan-${plan.id}`}
                  className="font-sans text-lg font-semibold"
                >
                  {plan.name}
                </h2>
                {featured && <Badge>Most popular</Badge>}
              </div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-3 text-muted-foreground">{plan.summary}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8"
                size="lg"
                variant={featured ? 'default' : 'outline'}
                asChild
              >
                {plan.id === 'free' ? (
                  <Link to="/login" search={{ mode: 'signup' }}>
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    to="/settings"
                    search={{ tab: 'billing', plan: plan.id }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </Button>
            </section>
          )
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Have your own OpenAI or Anthropic key? Bring it and AI limits no longer
        apply. Coming soon.
      </p>

      <section
        aria-labelledby="billing-faq"
        className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr]"
      >
        <h2 id="billing-faq" className="text-3xl font-semibold tracking-tight">
          Billing questions
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
