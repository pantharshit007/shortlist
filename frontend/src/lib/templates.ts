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
