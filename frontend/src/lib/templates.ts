export const templateCategories = [
  { id: 'software-engineering', name: 'Software engineering' },
  { id: 'ai-ml', name: 'AI and ML' },
  { id: 'data', name: 'Data' },
  { id: 'product', name: 'Product' },
  { id: 'design', name: 'Design' },
  { id: 'students', name: 'Students and freshers' },
  { id: 'banking', name: 'Banking' },
  { id: 'finance', name: 'Finance and accounting' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'marketing-sales', name: 'Marketing and sales' },
  { id: 'executive', name: 'Executive' },
] as const

export type TemplateCategory = (typeof templateCategories)[number]['id']

// Mirrors the backend's template registry; previews are real renders in public/templates.
// The first category is the primary one, used to group templates in the editor.
export const templateCatalog = [
  {
    id: 'developer',
    name: 'Developer',
    description:
      'The Jake-style layout most developers use, with icons for your links.',
    fontSize: 10,
    atsSafe: true,
    categories: ['software-engineering', 'ai-ml', 'data'],
  },
  {
    id: 'jake',
    name: "Jake's Resume",
    description: 'Classic single-column layout, the standard for tech roles.',
    fontSize: 11,
    atsSafe: true,
    categories: ['software-engineering', 'students', 'ai-ml'],
  },
  {
    id: 'sb2nov',
    name: 'Compact',
    description: 'Denser layout that fits more on one page.',
    fontSize: 10,
    atsSafe: true,
    categories: ['software-engineering', 'students', 'data'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sans-serif type with teal section headings.',
    fontSize: 10,
    atsSafe: true,
    categories: ['software-engineering', 'product', 'design'],
  },
  {
    id: 'ml-research',
    name: 'Research',
    description:
      'Serif CV with numbered, citation-style publications for ML and research roles.',
    fontSize: 11,
    atsSafe: true,
    categories: ['ai-ml', 'data'],
  },
  {
    id: 'data-analyst',
    name: 'Analyst',
    description:
      'Dense sans-serif layout with a key and value skills block for data work.',
    fontSize: 10,
    atsSafe: true,
    categories: ['data', 'ai-ml'],
  },
  {
    id: 'product-manager',
    name: 'Product',
    description: 'Roomy, outcome-first layout with square bullets for PMs.',
    fontSize: 11,
    atsSafe: true,
    categories: ['product'],
  },
  {
    id: 'designer',
    name: 'Designer',
    description:
      'Two-column layout with a sidebar for UI/UX designers. Columns can trip up some ATS.',
    fontSize: 10,
    atsSafe: false,
    categories: ['design', 'product'],
  },
  {
    id: 'campus',
    name: 'Campus',
    description:
      'Placement format with education first and a degree, score and year table.',
    fontSize: 10,
    atsSafe: true,
    categories: ['students', 'software-engineering'],
  },
  {
    id: 'banking',
    name: 'Investment Banking',
    description:
      'Dense one-page Wall Street layout: serif type, education first, dates on the right.',
    fontSize: 10,
    atsSafe: true,
    categories: ['banking', 'finance', 'students'],
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    description:
      'Classic serif with navy headings and your certifications near the top.',
    fontSize: 11,
    atsSafe: true,
    categories: ['finance', 'banking'],
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description:
      'Clean one-page layout with ruled headings for impact-first bullets.',
    fontSize: 11,
    atsSafe: true,
    categories: ['consulting', 'finance', 'product'],
  },
  {
    id: 'marketing',
    name: 'Marketing & Sales',
    description:
      'Friendly sans-serif with a warm accent, a tagline and a summary up top.',
    fontSize: 11,
    atsSafe: true,
    categories: ['marketing-sales'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description:
      'Elegant Garamond layout with a summary, core competencies and board roles.',
    fontSize: 11,
    atsSafe: true,
    categories: ['executive', 'consulting', 'finance'],
  },
] as const satisfies readonly {
  id: string
  name: string
  description: string
  fontSize: number
  atsSafe: boolean
  categories: readonly [TemplateCategory, ...TemplateCategory[]]
}[]

export const categoryName = (id: TemplateCategory) =>
  templateCategories.find((category) => category.id === id)?.name ?? id

export const inCategory = (
  template: { categories: readonly string[] },
  category?: TemplateCategory,
) => !category || template.categories.includes(category)

export type TemplateId = (typeof templateCatalog)[number]['id']

// Starting point for the "Blank page" template: a plain document to write LaTeX from scratch.
export const blankLatex = String.raw`\documentclass[10pt]{article}
\usepackage[margin=0.6in]{geometry}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}

\pagestyle{empty}
\setlength{\parindent}{0pt}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{10pt}{6pt}
\setlist[itemize]{leftmargin=1.2em, itemsep=1pt, topsep=2pt}

\begin{document}

\begin{center}
  {\LARGE\bfseries Your Name} \\[4pt]
  you@example.com \quad \textbar \quad +91 98765 43210 \quad \textbar \quad
  \href{https://github.com/you}{github.com/you}
\end{center}

\section{Experience}
\textbf{Role} \hfill Month Year -- Present \\
\textit{Company}, City
\begin{itemize}
  \item What you built, and what changed because of it.
\end{itemize}

\section{Projects}
\textbf{Project name} \hfill \href{https://github.com/you/project}{Code}
\begin{itemize}
  \item What it does and the tools you used.
\end{itemize}

\section{Education}
\textbf{College name} \hfill Year \\
Degree, branch

\section{Skills}
\textbf{Languages:} \\
\textbf{Tools:}

\end{document}
`
