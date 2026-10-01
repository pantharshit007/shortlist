// Every word list the ATS score uses, kept small and in one place.

// Base forms; "-ed", "-d", "-s" and "-ing" forms match too, and any other word ending in "-ed" counts.
export const ACTION_VERBS = new Set(
  (
    "achieve analyze analyse architect automate boost build chair coordinate create cut debug decrease deliver " +
    "deploy design develop direct drive enable engineer establish execute expand found generate grow head " +
    "implement improve increase integrate introduce launch lead maintain manage mentor migrate optimize optimise " +
    "organize organise own pioneer plan present produce program publish rank raise reduce refactor research " +
    "resolve restructure revamp rewrite save scale secure ship simplify solve spearhead speed streamline " +
    "supervise teach test train transform troubleshoot unify upgrade win write"
  ).split(" "),
);

// Irregular past tenses of the verbs above.
export const IRREGULAR_VERBS = new Set([
  "built",
  "cut",
  "drove",
  "founded",
  "grew",
  "led",
  "ran",
  "won",
  "wrote",
  "taught",
]);

export const CLICHES = [
  "team player",
  "hard working",
  "hardworking",
  "detail oriented",
  "results driven",
  "self motivated",
  "go getter",
  "think outside the box",
  "synergy",
  "dynamic individual",
  "quick learner",
  "responsible for",
  "duties included",
  "worked on",
  "helped with",
];

// Heading text (lowercased, letters only) mapped to the section an ATS files it under.
export const SECTION_HEADINGS: { id: string; pattern: RegExp }[] = [
  { id: "summary", pattern: /^(professional |career )?(summary|profile|objective|about me|about)$/ },
  {
    id: "experience",
    pattern:
      /^((work|professional|relevant|industry|internship) )?(experience|employment( history)?|work history|internships?)$/,
  },
  {
    id: "education",
    pattern: /^(education|academics?|academic (background|details|qualifications)|educational qualifications?)$/,
  },
  {
    id: "skills",
    pattern:
      /^((technical|core|key|relevant) )?(skills|competencies|skill set|technologies|tech stack)( (and|&) [a-z]+( [a-z]+)?)?$/,
  },
  { id: "projects", pattern: /^((personal|academic|key|selected|technical|side|relevant|major) )?projects$/ },
  { id: "certifications", pattern: /^((licenses|licences) (and|&) )?certifications?( (and|&) [a-z]+)?$|^courses$/ },
  {
    id: "achievements",
    pattern: /^(achievements|accomplishments|awards|honou?rs)( (and|&) (achievements|awards|honou?rs|[a-z]+))?$/,
  },
  {
    id: "leadership",
    pattern:
      /^(positions? of responsibility|leadership( experience)?|extra ?curricular( activities)?|activities|volunteer(ing| experience)?)$/,
  },
  { id: "publications", pattern: /^(publications|research( experience)?)$/ },
  { id: "coursework", pattern: /^(relevant )?coursework$/ },
  { id: "links", pattern: /^(links|profiles|coding profiles)$/ },
];

// Skills an ATS or recruiter searches for, used to read keywords out of a pasted job description.
// Each group lists one skill's spellings, the first being the one shown. Ambiguous words (Go, C, R,
// Spring, Excel) are left out because job ads use them as plain English.
// ponytail: a fixed list misses skills outside it; a signed-in user's saved job gets an AI parse instead.
export const SKILLS: string[][] = [
  ["Python"],
  ["Java"],
  ["JavaScript", "JS"],
  ["TypeScript", "TS"],
  ["C++", "CPP"],
  ["C#", "C Sharp"],
  ["Golang"],
  ["Rust"],
  ["Kotlin"],
  ["Swift"],
  ["Dart"],
  ["PHP"],
  ["Ruby"],
  ["Ruby on Rails", "Rails"],
  ["Scala"],
  ["SQL"],
  ["NoSQL"],
  ["Bash", "Shell scripting"],
  ["HTML", "HTML5"],
  ["CSS", "CSS3"],
  ["Tailwind", "Tailwind CSS", "TailwindCSS"],
  ["React", "React.js", "ReactJS"],
  ["React Native"],
  ["Next.js", "NextJS"],
  ["Angular"],
  ["Vue", "Vue.js", "VueJS"],
  ["Redux"],
  ["Node.js", "NodeJS", "Node"],
  ["Express.js", "ExpressJS"],
  ["Django"],
  ["Flask"],
  ["FastAPI"],
  ["Spring Boot"],
  ["Laravel"],
  ["Flutter"],
  ["Android"],
  ["iOS"],
  ["REST", "REST APIs", "RESTful"],
  ["GraphQL"],
  ["gRPC"],
  ["Microservices"],
  ["System Design"],
  ["Data Structures", "DSA"],
  ["Algorithms"],
  ["OOP", "Object Oriented Programming"],
  ["PostgreSQL", "Postgres"],
  ["MySQL"],
  ["MongoDB"],
  ["Redis"],
  ["Elasticsearch"],
  ["Kafka"],
  ["RabbitMQ"],
  ["Firebase"],
  ["AWS", "Amazon Web Services"],
  ["Azure"],
  ["GCP", "Google Cloud"],
  ["Docker"],
  ["Kubernetes", "K8s"],
  ["Terraform"],
  ["CI/CD"],
  ["Jenkins"],
  ["GitHub Actions"],
  ["Git"],
  ["Linux"],
  ["Nginx"],
  ["Machine Learning", "ML"],
  ["Deep Learning"],
  ["NLP", "Natural Language Processing"],
  ["Computer Vision"],
  ["LLM", "LLMs"],
  ["Generative AI", "GenAI"],
  ["TensorFlow"],
  ["PyTorch"],
  ["scikit-learn", "sklearn"],
  ["Pandas"],
  ["NumPy"],
  ["Spark", "PySpark", "Apache Spark"],
  ["Hadoop"],
  ["Airflow"],
  ["ETL"],
  ["Snowflake"],
  ["Tableau"],
  ["Power BI"],
  ["Data Analysis"],
  ["Statistics"],
  ["Unit Testing"],
  ["Jest"],
  ["Selenium"],
  ["Cypress"],
  ["Playwright"],
  ["Agile"],
  ["Scrum"],
  ["Jira"],
  ["Figma"],
  ["Blockchain"],
  ["Solidity"],
];
