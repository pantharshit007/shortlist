import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'
import { templateCatalog } from '@/lib/templates'

export const Route = createFileRoute('/_site/templates')({
  head: () => ({
    meta: [
      { title: `Resume templates | ${site.name}` },
      {
        name: 'description',
        content:
          'LaTeX-quality resume templates for software engineers, free to use.',
      },
    ],
  }),
  component: TemplatesPage,
})

function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14 lg:pt-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Resume templates
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Every template is typeset with LaTeX and fits one page. Switch between
          them anytime; your content stays the same.
        </p>
      </div>
      <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2">
        {templateCatalog.map((template, index) => (
          <li
            key={template.id}
            id={template.id}
            className="flex scroll-mt-24 flex-col gap-4"
          >
            <img
              src={`/templates/${template.id}.png`}
              alt={`${template.name} template with a sample resume`}
              width={1020}
              height={1320}
              loading={index < 2 ? 'eager' : 'lazy'}
              className="w-full rounded-sm bg-sheet shadow-sm ring-1 ring-black/5"
            />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-sans text-xl font-semibold">
                  {template.name}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <Button asChild>
                <Link to="/resumes/new" search={{ template: template.id }}>
                  Use this template
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
