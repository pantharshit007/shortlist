import { describe, expect, it } from "vitest";
import { scoreResume, skillsInJobDescription, texToText } from "../src/modules/ats/scoring.js";
import { atsReport } from "../src/modules/ats/ats.schemas.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";

const strong = `Aarav Sharma
Backend Engineer
aarav.sharma@example.com | +91 98765 43210 | Bengaluru, India
linkedin.com/in/aarav-sharma | github.com/aarav

Experience
Software Engineer, Razorpay | Jul 2022 - Present
• Built a payments reconciliation service in Go and PostgreSQL that matches 2M transactions a day
• Reduced p95 API latency from 480ms to 120ms by adding Redis caching and query indexes
• Led a team of 3 engineers to migrate 40 cron jobs to Kafka consumers, cutting failures by 60%
• Designed REST APIs used by 12 internal teams, with OpenAPI docs and contract tests
Software Engineering Intern, Zoho | Jan 2022 - Jun 2022
• Shipped a CSV import tool in Node.js that saved support 15 hours a week
• Wrote 120 unit tests with Jest, raising coverage from 45% to 82%

Projects
Ledger, an open source double-entry ledger | github.com/aarav/ledger
• Implemented idempotent writes in TypeScript and PostgreSQL, handling 5k requests per second in load tests
• Deployed on AWS with Docker and GitHub Actions, used by 300 developers

Education
B.Tech in Computer Science, IIT Delhi | 2018 - 2022 | CGPA 8.7/10

Skills
Languages: Go, TypeScript, Python, SQL
Backend: Node.js, PostgreSQL, Redis, Kafka, Docker, AWS
Practices: System Design, Unit Testing, CI/CD

Achievements
• Ranked 312 of 25,000 in Google Kick Start 2021
`;

const weak = `Rohan
I am a hard working team player and quick learner who is passionate about technology and wants to work in a dynamic company where I can grow my skills and contribute to the success of the organisation. I have done many projects in college and I am good at coding and problem solving and I believe I will be an asset to any team that I join in the future.

Hobbies
Cricket, music, travelling and reading books about many different subjects in my free time.
`;

const job = {
  role: "Backend Engineer",
  mustHave: ["PostgreSQL", "Kubernetes"],
  keywords: ["Kafka", "GraphQL", "Redis"],
};

describe("scoreResume", () => {
  it("scores a strong resume high and a weak one low", () => {
    const high = scoreResume({ text: strong });
    const low = scoreResume({ text: weak });
    expect(high.score).toBeGreaterThanOrEqual(85);
    expect(high.grade).toBe("excellent");
    expect(low.score).toBeLessThan(40);
    expect(low.grade).toBe("poor");
    expect(atsReport.parse(high)).toEqual(high);
    expect(high.stats).toMatchObject({ bullets: 9, quantifiedBullets: 9 });
    expect(high.stats.sections).toEqual(["experience", "projects", "education", "skills", "achievements"]);
  });

  it("gives the same report for the same input", () => {
    expect(scoreResume({ text: strong, job })).toEqual(scoreResume({ text: strong, job }));
  });

  it("leaves fix null on passing checks and gives one on the rest", () => {
    for (const report of [scoreResume({ text: strong }), scoreResume({ text: weak })]) {
      for (const check of report.categories.flatMap((c) => c.checks)) {
        if (check.status === "pass") expect(check.fix).toBeNull();
        else expect(check.fix).toBeTruthy();
      }
    }
    const fixes = scoreResume({ text: weak }).categories.flatMap((c) => c.checks.map((check) => check.fix ?? ""));
    expect(fixes.join(" ")).not.toMatch(/[\u2013\u2014]/);
  });

  it("matches job keywords and re-weights without a job", () => {
    const withJob = scoreResume({ text: strong, job });
    expect(withJob.keywords).toEqual({ matched: ["PostgreSQL", "Kafka", "Redis"], missing: ["Kubernetes", "GraphQL"] });
    expect(withJob.categories.map((c) => c.maxScore)).toEqual([15, 10, 15, 25, 10, 25]);
    expect(withJob.categories.at(-1)!.checks.map((c) => c.id)).toEqual(["keywords", "job-title"]);

    const without = scoreResume({ text: strong });
    expect(without.keywords).toBeNull();
    expect(without.categories.map((c) => c.id)).not.toContain("job");
    expect(without.categories.reduce((sum, c) => sum + c.maxScore, 0)).toBe(100);
  });

  it("reads known skills out of a pasted job description", () => {
    const skills = skillsInJobDescription(
      "You will build APIs in Node.js and Postgres. Experience with React. Go above and beyond.",
    );
    expect(skills).toEqual(["React", "Node.js", "PostgreSQL"]);
  });

  it("scores structured content from its fields and LaTeX from its text", () => {
    const content = resumeContentSchema.parse({
      basics: { name: "A", email: "a@example.com", links: [{ label: "LinkedIn", url: "https://linkedin.com/in/a" }] },
      sections: [
        {
          id: "x",
          type: "experience",
          title: "Where I've worked",
          entries: [
            { id: "e", organization: "Acme", role: "SWE", bullets: [{ id: "b", text: "Worked on the **API**" }] },
          ],
        },
      ],
    });
    const report = scoreResume({ content });
    const checks = Object.fromEntries(report.categories.flatMap((c) => c.checks).map((c) => [c.id, c]));
    expect(checks.linkedin!.status).toBe("pass");
    expect(checks.headings!.status).toBe("warn");
    expect(checks.dates!.status).toBe("warn");
    expect(checks.quantified!.fix).toContain('"Worked on the API"');

    const text = texToText(
      "\\documentclass{article}\\begin{document}\\section*{Experience}\\begin{itemize}\\item \\textbf{Cut} costs by 30\\% % note\n\\end{itemize}\\end{document}",
    );
    expect(text).toBe("Experience\n\n• Cut costs by 30%");
  });
});
