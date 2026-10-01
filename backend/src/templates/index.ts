import type { ResumeContent } from "../schemas/resume-content.js";
import { renderBanking } from "./banking.js";
import { renderCampus } from "./campus.js";
import { renderConsulting } from "./consulting.js";
import { renderDataAnalyst } from "./data-analyst.js";
import { renderDesigner } from "./designer.js";
import { renderDeveloper } from "./developer.js";
import { renderExecutive } from "./executive.js";
import { renderFinance } from "./finance.js";
import { renderJake } from "./jake.js";
import type { ResumeLayout } from "./layout.js";
import { renderMarketing } from "./marketing.js";
import { renderMlResearch } from "./ml-research.js";
import { renderModern } from "./modern.js";
import { renderProductManager } from "./product-manager.js";
import { renderSb2nov } from "./sb2nov.js";

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  atsSafe: boolean;
  version: number;
  render: (content: ResumeContent, layout?: ResumeLayout) => string;
};

export const templates: TemplateDefinition[] = [
  {
    id: "developer",
    name: "Developer",
    description: "The Jake's Resume variant most developers use: icon header, dense layout, company above role.",
    atsSafe: true,
    version: 1,
    render: renderDeveloper,
  },
  {
    id: "jake",
    name: "Jake's Resume",
    description: "Classic single-column layout popular with software engineers.",
    atsSafe: true,
    version: 1,
    render: renderJake,
  },
  {
    id: "sb2nov",
    name: "Compact",
    description: "Denser single-column layout with contact details on the right.",
    atsSafe: true,
    version: 1,
    render: renderSb2nov,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sans-serif, accent-colored headings, inspired by Awesome-CV.",
    atsSafe: true,
    version: 1,
    render: renderModern,
  },
  {
    id: "ml-research",
    name: "Research",
    description:
      "Serif CV with small-caps headings and numbered, citation-style publications, for ML engineers and researchers.",
    atsSafe: true,
    version: 1,
    render: renderMlResearch,
  },
  {
    id: "data-analyst",
    name: "Analyst",
    description:
      "Dense sans-serif layout with accent-bar headings and a key and value skills block, for data scientists and analysts.",
    atsSafe: true,
    version: 1,
    render: renderDataAnalyst,
  },
  {
    id: "product-manager",
    name: "Product",
    description: "Roomy, outcome-first layout with a bold header rule and square bullets, for product managers.",
    atsSafe: true,
    version: 1,
    render: renderProductManager,
  },
  {
    id: "designer",
    name: "Designer",
    description:
      "Two-column layout with a sidebar for contact, skills and education, for UI/UX and product designers; columns may not parse well in ATS.",
    atsSafe: false,
    version: 1,
    render: renderDesigner,
  },
  {
    id: "campus",
    name: "Campus",
    description:
      "Campus placement format with education first as a degree, institution, score and year table, and shaded section bars.",
    atsSafe: true,
    version: 1,
    render: renderCampus,
  },
  {
    id: "banking",
    name: "Investment Banking",
    description:
      "Dense one-page Wall Street layout: serif type, bold firm names, locations and dates on the right, education first.",
    atsSafe: true,
    version: 1,
    render: renderBanking,
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    description: "Classic serif with navy headings and your credentials under the name, certifications near the top.",
    atsSafe: true,
    version: 1,
    render: renderFinance,
  },
  {
    id: "consulting",
    name: "Consulting",
    description: "Clean one-page sans-serif layout with ruled headings and square bullets for impact-first results.",
    atsSafe: true,
    version: 1,
    render: renderConsulting,
  },
  {
    id: "marketing",
    name: "Marketing & Sales",
    description: "Friendly sans-serif with a warm accent color, a tagline under your name and the summary up top.",
    atsSafe: true,
    version: 1,
    render: renderMarketing,
  },
  {
    id: "executive",
    name: "Executive",
    description:
      "Elegant Garamond layout with summary and core competencies first, roles grouped by company and board roles.",
    atsSafe: true,
    version: 1,
    render: renderExecutive,
  },
];

export function findTemplate(id: string) {
  return templates.find((template) => template.id === id);
}
