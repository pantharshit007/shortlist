import { createTectonic } from "../lib/latex/tectonic.js";
import { templates } from "../templates/index.js";
import { sampleResume } from "../templates/sample.js";

// Run at image build time: compiles every template plus the packages common in pasted
// Overleaf resumes, so the TeX cache is complete and runtime compiles never need the network.

const commonPackages = String.raw`\documentclass[letterpaper,10pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{xcolor}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{fontawesome}
\usepackage{multicol}
\usepackage{geometry}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{array}
\usepackage{ragged2e}
\usepackage{setspace}
\usepackage{fontspec}
\begin{document}
\faGithub\ \faLinkedin\ \Letter\ Warm-up $x^2$ \textsc{Small Caps} \textbf{\textit{bold italic}}
\end{document}
`;

// Jake's Resume (sb2nov) preamble, the most pasted document, at every base size with every size command,
// so each font size's metrics (cm, lasy, marvosym) is cached.
const sizes = ["tiny", "scriptsize", "footnotesize", "small", "normalsize", "large", "Large", "LARGE", "huge", "Huge"];
const sampler = sizes
  .map(
    (size) =>
      `{\\${size} ` +
      String.raw`Aa \textbf{Aa} \textit{Aa} \textbf{\textit{Aa}} \textsc{Aa} \texttt{Aa} $x^2_i \Box \Diamond \mho \lhd \leadsto \Join$ \Letter\Mobilefone\Email}\par`,
  )
  .join("\n");
const jakePreamble = (pt: number) => String.raw`\documentclass[letterpaper,${pt}pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}
\pdfgentounicode=1
\begin{document}
{\scshape\bfseries Aa}
${sampler}
\end{document}
`;

const compile = createTectonic({
  bin: process.env.TECTONIC_BIN ?? "tectonic",
  onlyCached: false,
  timeoutMs: 600_000,
  concurrency: 1,
});

const documents = [
  ...templates.flatMap((t) =>
    ([undefined, 10, 11, 12] as const).map((fontSize) => ({
      name: `${t.id}${fontSize ? `-relaxed-${fontSize}pt` : ""}`,
      tex: t.render(sampleResume, fontSize ? { spacing: "relaxed", fontSize } : undefined),
    })),
  ),
  { name: "common-packages", tex: commonPackages },
  ...[10, 11, 12].map((pt) => ({ name: `jake-${pt}pt`, tex: jakePreamble(pt) })),
];

let failed = false;
for (const doc of documents) {
  const result = await compile(doc.tex);
  console.log(`${doc.name}: ${result.ok ? "ok" : JSON.stringify(result.errors)}`);
  if (!result.ok) failed = true;
}
process.exit(failed ? 1 : 0);
