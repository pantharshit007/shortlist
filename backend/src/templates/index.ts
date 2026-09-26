import type { ResumeContent } from "../schemas/resume-content.js";
import { renderJake } from "./jake.js";
import { renderModern } from "./modern.js";
import { renderSb2nov } from "./sb2nov.js";

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  atsSafe: boolean;
  version: number;
  render: (content: ResumeContent) => string;
};

export const templates: TemplateDefinition[] = [
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
];

export function findTemplate(id: string) {
  return templates.find((template) => template.id === id);
}
