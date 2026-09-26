// Mirrors the backend's template registry; previews are real renders in public/templates.
export const templateCatalog = [
  {
    id: 'developer',
    name: 'Developer',
    description:
      'The Jake-style layout most developers use, with icons for your links.',
  },
  {
    id: 'jake',
    name: "Jake's Resume",
    description: 'Classic single-column layout, the standard for tech roles.',
  },
  {
    id: 'sb2nov',
    name: 'Compact',
    description: 'Denser layout that fits more on one page.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sans-serif type with teal section headings.',
  },
] as const

export type TemplateId = (typeof templateCatalog)[number]['id']
