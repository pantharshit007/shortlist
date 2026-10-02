import type { ResumeContent, ResumeSection } from '@/lib/api/types'

// An HTML rendering of structured resume content, styled like the typeset PDF.

const monthFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatMonth(value?: string) {
  if (!value) return ''
  if (value === 'present') return 'Present'
  const [year, month] = value.split('-').map(Number)
  if (!year) return value
  return month
    ? monthFormat.format(new Date(Date.UTC(year, month - 1, 1)))
    : String(year)
}

function dateRange(start?: string, end?: string) {
  return [formatMonth(start), formatMonth(end)].filter(Boolean).join(' – ')
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\*\*(.+?)\*\*/g)
        .map((part, index) =>
          index % 2 === 1 ? <strong key={index}>{part}</strong> : part,
        )}
    </>
  )
}

type Bullet = { id: string; text: string; hidden: boolean }

function Bullets({ bullets }: { bullets: Bullet[] }) {
  const visible = bullets.filter((b) => !b.hidden)
  if (visible.length === 0) return null
  return (
    <ul className="mt-1 ml-5 flex list-disc flex-col gap-0.5 marker:text-neutral-500">
      {visible.map((bullet) => (
        <li key={bullet.id}>
          <Rich text={bullet.text} />
        </li>
      ))}
    </ul>
  )
}

function Heading({
  left,
  right,
  subLeft,
  subRight,
}: {
  left: React.ReactNode
  right?: string
  subLeft?: React.ReactNode
  subRight?: string
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-semibold">{left}</span>
        {right && <span className="text-sm font-semibold">{right}</span>}
      </div>
      {(subLeft || subRight) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm italic">
          <span>{subLeft}</span>
          {subRight && <span>{subRight}</span>}
        </div>
      )}
    </div>
  )
}

function Section({ section }: { section: ResumeSection }) {
  const title = (
    <h2 className="border-b border-neutral-800 pb-0.5 font-serif text-lg font-semibold [font-variant-caps:small-caps]">
      {section.title}
    </h2>
  )
  switch (section.type) {
    case 'skills':
      if (section.groups.every((g) => g.items.length === 0)) return null
      return (
        <section className="flex flex-col gap-2">
          {title}
          <div className="flex flex-col gap-0.5 text-[0.95rem]">
            {section.groups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <p key={group.id}>
                  <strong>{group.name}</strong>: {group.items.join(', ')}
                </p>
              ))}
          </div>
        </section>
      )
    case 'summary':
      if (!section.text) return null
      return (
        <section className="flex flex-col gap-2">
          {title}
          <p className="text-[0.95rem]">
            <Rich text={section.text} />
          </p>
        </section>
      )
    case 'links':
      if (section.links.length === 0) return null
      return (
        <section className="flex flex-col gap-2">
          {title}
          <p className="text-[0.95rem]">
            {section.links.map((link, index) => (
              <span key={link.url}>
                {index > 0 && ', '}
                <a
                  href={link.url}
                  className="underline underline-offset-2 hover:text-neutral-600"
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label || link.url}
                </a>
              </span>
            ))}
          </p>
        </section>
      )
    default: {
      const entries = (
        section.entries as ({
          id: string
          hidden: boolean
          bullets: Bullet[]
        } & Record<string, unknown>)[]
      ).filter((entry) => !entry.hidden)
      if (entries.length === 0) return null
      return (
        <section className="flex flex-col gap-2">
          {title}
          <div className="flex flex-col gap-3 text-[0.95rem]">
            {entries.map((entry) => {
              const e = entry as Record<string, string | undefined> & {
                bullets: Bullet[]
                technologies?: string[]
                links?: { label: string; url: string }[]
              }
              let heading: React.ReactNode
              if (section.type === 'experience') {
                heading = (
                  <Heading
                    left={e.organization}
                    right={dateRange(e.start, e.end)}
                    subLeft={e.role}
                    subRight={e.location}
                  />
                )
              } else if (section.type === 'education') {
                const degree = [e.degree, e.field].filter(Boolean).join(' in ')
                heading = (
                  <Heading
                    left={e.institution}
                    right={dateRange(e.start, e.end)}
                    subLeft={[degree, e.score && `(${e.score})`]
                      .filter(Boolean)
                      .join(' ')}
                    subRight={e.location}
                  />
                )
              } else if (section.type === 'projects') {
                heading = (
                  <Heading
                    left={
                      <>
                        {e.name}
                        {e.technologies && e.technologies.length > 0 && (
                          <span className="font-normal italic">
                            {' '}
                            | {e.technologies.join(', ')}
                          </span>
                        )}
                        {e.links?.map((link) => (
                          <span key={link.url} className="font-normal">
                            {' | '}
                            <a
                              href={link.url}
                              className="underline underline-offset-2 hover:text-neutral-600"
                              rel="noreferrer"
                              target="_blank"
                            >
                              {link.label || link.url}
                            </a>
                          </span>
                        ))}
                      </>
                    }
                    right={dateRange(e.start, e.end)}
                  />
                )
              } else {
                heading = (
                  <Heading
                    left={
                      <>
                        {e.url ? (
                          <a
                            href={e.url}
                            className="underline underline-offset-2 hover:text-neutral-600"
                            rel="noreferrer"
                            target="_blank"
                          >
                            {e.title}
                          </a>
                        ) : (
                          e.title
                        )}
                        {e.subtitle && (
                          <span className="font-normal"> | {e.subtitle}</span>
                        )}
                      </>
                    }
                    right={e.date}
                  />
                )
              }
              return (
                <div key={entry.id}>
                  {heading}
                  <Bullets bullets={e.bullets} />
                </div>
              )
            })}
          </div>
        </section>
      )
    }
  }
}

export function ResumeDocument({ content }: { content: ResumeContent }) {
  const { basics } = content
  const contacts = [
    basics.phone && <span key="phone">{basics.phone}</span>,
    basics.email && (
      <a
        key="email"
        href={`mailto:${basics.email}`}
        className="underline underline-offset-2 hover:text-neutral-600"
      >
        {basics.email}
      </a>
    ),
    basics.location && <span key="location">{basics.location}</span>,
    ...basics.links.map((link) => (
      <a
        key={link.url}
        href={link.url}
        className="underline underline-offset-2 hover:text-neutral-600"
        rel="noreferrer"
        target="_blank"
      >
        {link.label || link.url}
      </a>
    )),
  ].filter(Boolean)

  return (
    <article className="bg-sheet px-6 py-8 font-serif leading-snug text-sheet-foreground sm:px-12 sm:py-12">
      <header className="text-center">
        {basics.name && (
          <h1 className="text-4xl font-normal break-words [font-variant-caps:small-caps]">
            {basics.name}
          </h1>
        )}
        {basics.headline && <p className="mt-1">{basics.headline}</p>}
        {contacts.length > 0 && (
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm break-all">
            {contacts.map((item, index) => (
              <span key={index} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true">|</span>}
                {item}
              </span>
            ))}
          </p>
        )}
      </header>
      <div className="mt-6 flex flex-col gap-5">
        {content.sections
          .filter((section) => !section.hidden)
          .map((section) => (
            <Section key={section.id} section={section} />
          ))}
      </div>
    </article>
  )
}
