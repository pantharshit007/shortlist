import type { ResumeContent, ResumeSection } from "../schemas/resume-content.js";
import { dateRange, tex, texRich, texUrl, visibleContent } from "./latex.js";

// The Jake's Resume variant popular with Indian developers: small-caps name, icon header,
// tight margins, company above a bold role, projects with Live and Github links.
// Based on Jake Gutierrez's template (MIT), adapted for XeTeX.

const preamble = String.raw`\documentclass[letterpaper,10pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}

\addtolength{\oddsidemargin}{-0.7in}
\addtolength{\evensidemargin}{-0.7in}
\addtolength{\textwidth}{1.4in}
\addtolength{\topmargin}{-0.7in}
\addtolength{\textheight}{1.4in}

\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large\bfseries}{}{0em}{}[\color{black}\titlerule \vspace{-4pt}]

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\newcommand{\resumeItem}[1]{\item\small{#1 \vspace{-2pt}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
  \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{#1} & \textbf{\small #2} \\
    \textit{\small#3} & \textit{\small #4} \\
  \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
  \item
  \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
    \small#1 & \textbf{\small #2} \\
  \end{tabular*}\vspace{-7pt}
}
\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
`;

function iconFor(label: string, url: string) {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes("linkedin")) return "\\faLinkedin";
  if (value.includes("github")) return "\\faGithub";
  if (value.includes("leetcode") || value.includes("codeforces") || value.includes("codechef")) return "\\faCode";
  return "\\faGlobe";
}

const iconLink = (url: string, icon: string, label: string) =>
  `\\href{${texUrl(url)}}{\\raisebox{-0.2\\height}${icon}\\ \\underline{${tex(label)}}}`;

function header(basics: ResumeContent["basics"]) {
  const parts = [
    basics.phone ? `\\raisebox{-0.2\\height}\\faPhone*\\ ${tex(basics.phone)}` : undefined,
    basics.email ? iconLink(`mailto:${basics.email}`, "\\faEnvelope", basics.email) : undefined,
    basics.location ? `\\raisebox{-0.2\\height}\\faMapMarker*\\ ${tex(basics.location)}` : undefined,
    ...basics.links.map((link) => iconLink(link.url, iconFor(link.label, link.url), link.label)),
  ].filter(Boolean);
  return parts.join(" ~\n  ");
}

function bullets(items: { text: string }[]) {
  if (items.length === 0) return "";
  return ["\\resumeItemListStart", ...items.map((item) => `  \\resumeItem{${texRich(item.text)}}`), "\\resumeItemListEnd"].join("\n");
}

const link = (url: string, label: string) => `\\href{${texUrl(url)}}{\\underline{${tex(label)}}}`;

function section(title: string, body: string) {
  return `\\section{${tex(title)}}\n${body}`;
}

function renderSection(s: ResumeSection): string {
  switch (s.type) {
    case "skills": {
      const lines = s.groups
        .filter((group) => group.items.length > 0)
        .map((group) => `    \\textbf{${tex(group.name)}}{: ${tex(group.items.join(", "))}}`)
        .join(" \\\\\n");
      if (!lines) return "";
      return section(s.title, `\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\item \\small{\n${lines}\n  }\n\\end{itemize}`);
    }
    case "links":
      if (s.links.length === 0) return "";
      return section(
        s.title,
        `\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\item \\small{\n    ${s.links.map((l) => link(l.url, l.label)).join(", ")}\n  }\n\\end{itemize}`,
      );
    case "experience": {
      if (s.entries.length === 0) return "";
      const entries = s.entries.map((e) =>
        [
          `\\resumeSubheading\n  {${tex(e.organization)}}{${dateRange(e.start, e.end)}}\n  {\\textbf{${tex(e.role)}}}{${tex(e.location)}}`,
          bullets(e.bullets),
        ].join("\n"),
      );
      return section(s.title, `\\resumeSubHeadingListStart\n${entries.join("\n\\vspace{-5pt}\n")}\n\\resumeSubHeadingListEnd`);
    }
    case "education": {
      if (s.entries.length === 0) return "";
      const entries = s.entries.map((e) => {
        const degree = [e.degree ? tex(e.degree) : "", e.field ? `\\textbf{${tex(e.field)}}` : ""].filter(Boolean).join(" in ");
        const subtitle = [degree, e.score ? `(${tex(e.score)})` : ""].filter(Boolean).join(" ");
        return [
          `\\resumeSubheading\n  {${tex(e.institution)}}{${dateRange(e.start, e.end)}}\n  {${subtitle}}{${tex(e.location)}}`,
          bullets(e.bullets),
        ].join("\n");
      });
      return section(s.title, `\\resumeSubHeadingListStart\n${entries.join("\n")}\n\\resumeSubHeadingListEnd`);
    }
    case "projects": {
      if (s.entries.length === 0) return "";
      const entries = s.entries.map((e) => {
        const title = e.url ? `\\href{${texUrl(e.url)}}{\\textbf{${tex(e.name)}}}` : `\\textbf{${tex(e.name)}}`;
        const tech = e.technologies.length
          ? ` $|$ \\emph{${e.technologies.map((t) => `\\textbf{${tex(t)}}`).join(", ")}}`
          : "";
        const links = e.links.map((l) => ` $|$ ${link(l.url, l.label)}`).join("");
        return [`\\resumeProjectHeading\n  {${title}${tech}${links}}{${dateRange(e.start, e.end)}}\n\\vspace{-10pt}`, bullets(e.bullets)].join("\n");
      });
      return section(s.title, `\\resumeSubHeadingListStart\n${entries.join("\n\\vspace{-13pt}\n")}\n\\resumeSubHeadingListEnd`);
    }
    case "list": {
      if (s.entries.length === 0) return "";
      const entries = s.entries.map((e) => {
        const title = e.url ? link(e.url, e.title) : `\\textbf{${tex(e.title)}}`;
        const subtitle = e.subtitle ? ` $|$ \\emph{${tex(e.subtitle)}}` : "";
        return [`\\resumeProjectHeading\n  {${title}${subtitle}}{${tex(e.date)}}`, bullets(e.bullets)].join("\n");
      });
      return section(s.title, `\\resumeSubHeadingListStart\n${entries.join("\n")}\n\\resumeSubHeadingListEnd`);
    }
  }
}

export function renderDeveloper(input: ResumeContent) {
  const { basics, sections } = visibleContent(input);
  const headline = basics.headline ? `\n  \\small ${tex(basics.headline)} \\\\ \\vspace{1pt}` : "";
  return `${preamble}
\\begin{document}
\\begin{center}
  {\\Huge \\scshape ${tex(basics.name)}} \\\\ \\vspace{1pt}${headline}
  ${header(basics)} \\\\
  \\vspace{-3pt}
\\end{center}

${sections.map(renderSection).filter(Boolean).join("\n\n")}

\\end{document}
`;
}
