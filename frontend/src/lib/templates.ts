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
