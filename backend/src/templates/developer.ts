import type { ResumeContent } from "../schemas/resume-content.js";
import { renderSections } from "./classic-body.js";
import { tex, texUrl, visibleContent } from "./latex.js";

// The Jake's Resume variant popular with Indian developers: icon header, tighter margins,
// company above role, bold dates. Based on Jake Gutierrez's template (MIT), adapted for XeTeX.

function iconFor(label: string, url: string) {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes("linkedin")) return "\\faLinkedin";
  if (value.includes("github")) return "\\faGithub";
  if (value.includes("leetcode") || value.includes("codeforces")) return "\\faCode";
  return "\\faGlobe";
}

function header(basics: ResumeContent["basics"]) {
  const parts = [
    basics.phone ? `\\faPhone* \\ ${tex(basics.phone)}` : undefined,
    basics.email ? `\\faEnvelope \\ \\href{mailto:${texUrl(basics.email)}}{\\underline{${tex(basics.email)}}}` : undefined,
    ...basics.links.map((link) => `${iconFor(link.label, link.url)} \\ \\href{${texUrl(link.url)}}{\\underline{${tex(link.label)}}}`),
  ].filter(Boolean);
  return parts.join(" \\quad ");
}

export function renderDeveloper(input: ResumeContent) {
  const { basics, sections } = visibleContent(input);
  return String.raw`\documentclass[letterpaper,10pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx}
\usepackage{fontawesome5}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.7in}
\addtolength{\evensidemargin}{-0.7in}
\addtolength{\textwidth}{1.4in}
\addtolength{\topmargin}{-0.7in}
\addtolength{\textheight}{1.4in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\newcommand{\resumeItem}[1]{\item\small{#1 \vspace{-2pt}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}
\begin{center}
  \textbf{\Huge \scshape ${tex(basics.name)}} \\ \vspace{3pt}
  ${basics.headline ? String.raw`\small ${tex(basics.headline)} \\ \vspace{2pt}` : ""}
  \small ${header(basics)}
\end{center}

${renderSections(sections, { organizationFirst: true, educationDatesFirst: true })}
\end{document}
`;
}
