import { mkdir, readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
import { nameKey } from "../modules/ats/skills/tokens.js";

// Run by hand when the taxonomy should change: `pnpm exec tsx src/scripts/build-skills.ts`.
// Downloads are cached in .tmp/skills; delete that folder to fetch fresh copies.

const ONET_VERSION = "30.2";
const ONET_URL = `https://www.onetcenter.org/dl_files/database/db_${ONET_VERSION.replace(".", "_")}_text/Technology%20Skills.txt`;
const ESCO_API = "https://ec.europa.eu/esco/api/resource";
const ESCO_ICT_GROUPS = ["0611", "0612", "0613"].map((code) => `http://data.europa.eu/esco/isced-f/${code}`);
const ESCO_TRANSVERSAL = "http://data.europa.eu/esco/concept-scheme/skill-transversal-groups";
const CACHE = new URL("../../.tmp/skills/", import.meta.url);
const OUT = new URL("../modules/ats/skills/skills.json", import.meta.url);

// Output shape. `ambiguous`: the canonical name is a common word or a letter, so it only counts with
// context (see match.ts). `cased`: names that only count in this exact case ("React", not "react").
type Skill = {
  name: string;
  aliases: string[];
  kind: "hard" | "soft";
  category: string;
  source: string[];
  ambiguous?: true;
  cased?: string[];
};

// Hand-curated core, one skill per line: canonical name first, then aliases, split by "|".
// "!" marks an ambiguous canonical name, "~" marks a name that must match case.
const CORE: Record<string, string> = {
  language: `
Python|Python3|Python 3
Java|Core Java|Java 8|Java 17
JavaScript|JS|ECMAScript|ES6|Vanilla JS
TypeScript|~TS
C++|CPP|C plus plus|Modern C++
C#|C Sharp|CSharp
!Go|Golang|Go lang|Go programming|Go language
~Rust|Rust lang|Rust programming
Kotlin
~Swift|Swift programming
~Dart
PHP
~Ruby
Scala
!C|C programming|C language|ANSI C
Embedded C
!R|R programming|R language|RStudio|R Studio
Perl
MATLAB|The MathWorks MATLAB
Bash|Bash scripting|Shell scripting|Shell script|UNIX Shell|~Shell
PowerShell|Microsoft PowerShell
SQL|Structured Query Language
PL/SQL|Oracle PL/SQL
T-SQL|Transact-SQL|TSQL
Haskell
Elixir
Erlang
Clojure
F#
~Lua
~Julia
Objective-C|ObjC
Assembly language|x86 assembly|ARM assembly
Fortran
COBOL
VBA|Visual Basic for Applications|Microsoft Visual Basic for Applications
Visual Basic|VB.NET|Microsoft Visual Basic
Groovy
Solidity
Verilog
VHDL
SystemVerilog
~Zig
OCaml
Apex|Salesforce Apex
ABAP|SAP ABAP`,
  frontend: `
HTML|HTML5|Hypertext Markup Language
CSS|CSS3|Cascading Style Sheets
Sass|SCSS
Tailwind CSS|Tailwind|TailwindCSS
Bootstrap
Material UI|MUI
Chakra UI
shadcn/ui|shadcn
~React|React.js|ReactJS|React JS
Next.js|NextJS|Next JS
Angular|Google Angular|Angular 2
AngularJS|Angular.js
Vue.js|~Vue|VueJS|Vue 3
Nuxt.js|Nuxt|NuxtJS
Svelte|SvelteKit
Redux|Redux Toolkit|React Redux|RTK
Zustand
React Query|TanStack Query
jQuery
Webpack
Vite
Babel
Three.js|ThreeJS
D3.js|D3
Storybook
Gatsby
Remix
Web Components
Responsive design|responsive web design|mobile-first design
Web accessibility|accessibility|WCAG|a11y
Progressive Web Apps|PWA|PWAs
Framer Motion
GSAP
Ember.js|EmberJS
Backbone.js
Micro frontends|microfrontends
HTMX
Web performance|Core Web Vitals
Server-side rendering|SSR
AJAX`,
  backend: `
Node.js|NodeJS|Node JS|~Node
Express.js|ExpressJS|Express JS|~Express
NestJS|Nest.js
Django|Django REST Framework|DRF
Flask
FastAPI
Spring Boot|SpringBoot
!Spring|Spring Framework|Spring MVC|Spring Security
Hibernate|Hibernate ORM|JPA
Ruby on Rails|Rails|RoR
Laravel
.NET|DotNet|.NET Core|.NET Framework|Microsoft .NET Framework
ASP.NET|ASP.NET Core|ASP.NET MVC|Microsoft ASP.NET
REST APIs|REST|RESTful|RESTful APIs|REST API|RESTful API|RESTful services
GraphQL
gRPC
WebSockets|WebSocket
Socket.IO|Socket.io
Microservices|microservice|microservices architecture
System design|systems design
Low-level design|LLD
High-level design|HLD
Distributed systems
Event-driven architecture|event driven architecture|EDA
Message queues|message queue|message brokers
Kafka|Apache Kafka
RabbitMQ
Celery
Prisma
Sequelize
TypeORM
Drizzle ORM
Mongoose
JWT|JSON Web Tokens|JSON Web Token
OAuth|OAuth 2.0|OAuth2|OpenID Connect|OIDC
API design|API development
Serverless|serverless architecture
Nginx|NGINX
Apache Tomcat|Tomcat
Maven|Apache Maven
Gradle
Strapi
Supabase
Firebase|Google Firebase
Deno
~Bun
JSON|JavaScript Object Notation
XML|Extensible Markup Language
Caching|cache
Multithreading|multi-threading|concurrency
Java EE|J2EE|Jakarta EE|Oracle Java 2 Platform Enterprise Edition J2EE
Servlets|JSP
JDBC
OpenAPI|Swagger
MERN|MERN stack
MEAN|MEAN stack
LAMP stack
Web scraping|BeautifulSoup|Scrapy
LDAP
SaaS|Software as a service
Internet of Things|IoT
~Unity|Unity3D|Unity Technologies Unity
Unreal Engine
Payment gateway integration|Razorpay|Stripe API`,
  mobile: `
Android|Android development|Android SDK|Google Android
iOS|iOS development|Apple iOS
React Native
Flutter
SwiftUI
UIKit
Jetpack Compose
Xamarin
Ionic
Kotlin Multiplatform|KMP
Expo
Android Studio
Xcode`,
  database: `
PostgreSQL|Postgres|psql|pgSQL
MySQL
MongoDB|Mongo
Redis
SQLite
Oracle Database|Oracle DB|Oracle SQL
Microsoft SQL Server|SQL Server|MSSQL|MS SQL
NoSQL
Cassandra|Apache Cassandra
DynamoDB|Amazon DynamoDB
Elasticsearch|Elastic Search|OpenSearch
Neo4j
MariaDB
CockroachDB
Firestore|Cloud Firestore
Pinecone
Vector databases|vector database|vector DB|pgvector|Qdrant|Weaviate|Milvus|ChromaDB
Database design|database modeling|database modelling|schema design
DBMS|database management systems
RDBMS|relational databases|relational database
ClickHouse
Teradata|Teradata Database
IBM Db2|DB2
Memcached
~Hive|Apache Hive
SQL query optimization|query optimization|query tuning`,
  cloud: `
AWS|Amazon Web Services|Amazon Web Services AWS
Azure|Microsoft Azure
Google Cloud|GCP|Google Cloud Platform
EC2|Amazon EC2|Amazon Elastic Compute Cloud
S3|Amazon S3
AWS Lambda|~Lambda
AWS CloudFormation|CloudFormation
Cloudflare
Vercel
Netlify
Heroku
DigitalOcean
Oracle Cloud|OCI|Oracle Cloud Infrastructure
IBM Cloud
Azure DevOps|Microsoft Azure DevOps Services
ECS|Amazon ECS
EKS|Amazon EKS
AWS IAM|IAM
CloudWatch|Amazon CloudWatch
API Gateway|AWS API Gateway
Cloud computing
Google Kubernetes Engine|GKE
Azure Functions
AWS RDS|Amazon RDS
SQS|Amazon SQS
SNS|Amazon SNS`,
  devops: `
Docker|Docker Compose
Kubernetes|K8s
Terraform|IBM Terraform
Ansible
~Chef
~Puppet
Jenkins|Jenkins CI
GitHub Actions
GitLab CI|GitLab CI/CD
CircleCI
CI/CD|CICD|continuous integration|continuous delivery|continuous deployment
Git
GitHub
GitLab
Bitbucket|Atlassian Bitbucket
SVN|Subversion|Apache Subversion
Linux|Ubuntu|Red Hat Enterprise Linux|RHEL|CentOS
Unix
Prometheus
Grafana
Datadog
Splunk|Splunk Enterprise
New Relic
ELK Stack|ELK|Logstash|Kibana
Helm
Argo CD|ArgoCD
Istio
OpenShift|Red Hat OpenShift
Vagrant
Infrastructure as Code|IaC
DevOps
Site Reliability Engineering|SRE
Observability
Load balancing|load balancer|load balancers
TCP/IP
DNS
HTTP|HTTPS|HTTP/2
Linux administration|system administration|sysadmin
Windows Server|Microsoft Windows Server
Active Directory|Microsoft Active Directory
VMware
Virtualization
Networking|computer networking`,
  testing: `
Unit testing|unit tests
Integration testing|integration tests
End-to-end testing|E2E testing|e2e tests
Test automation|automation testing|automated testing
Manual testing
Jest
~Mocha
Vitest
Cypress
Playwright
Selenium|Selenium WebDriver
Appium
JUnit
TestNG
pytest|PyTest
Postman
JMeter|Apache JMeter
Cucumber|BDD|behavior-driven development|behaviour-driven development
TDD|test-driven development|test driven development
React Testing Library
Load testing|performance testing|stress testing
Quality assurance|QA
Regression testing
API testing`,
  fundamentals: `
Data structures|DSA|Data Structures and Algorithms|DS&A|DS and Algo
Algorithms
OOP|Object-oriented programming|object oriented programming|OOPS|OOPs concepts|OOP concepts
Operating systems|~OS
Computer networks
Design patterns
SOLID principles|~SOLID
Competitive programming
Dynamic programming
Computer architecture
Linear algebra
Probability
Discrete mathematics`,
  data: `
Data analysis|data analytics|data analyst skills
Data visualization|data visualisation
Statistics|statistical analysis|statistical modeling|statistical modelling
Pandas
NumPy
SciPy
Matplotlib
Seaborn
Plotly
Jupyter|Jupyter Notebook|Jupyter Notebooks|JupyterLab
Google Colab|Colab
Apache Spark|~Spark|Spark SQL
PySpark
Hadoop|Apache Hadoop|HDFS|MapReduce
Airflow|Apache Airflow
dbt|data build tool
ETL|ELT|ETL pipelines
Data pipelines|data pipeline
Data warehousing|data warehouse|data warehouses
Data modeling|data modelling|dimensional modeling|star schema
Snowflake
BigQuery|Google BigQuery
Redshift|Amazon Redshift
Databricks
Flink|Apache Flink
Tableau
Power BI|PowerBI|Microsoft Power BI
Looker
Looker Studio|Google Data Studio
Qlik|QlikView|Qlik Sense
Metabase
SAS
SPSS|IBM SPSS|IBM SPSS Statistics
Stata|StataCorp Stata
Alteryx
A/B testing|AB testing|split testing|A/B tests
Hypothesis testing
Regression analysis|linear regression|logistic regression
Time series analysis|time series|time series forecasting
Data cleaning|data wrangling|data cleansing
Data mining
Big data
Google Sheets
Data engineering
Informatica|Informatica PowerCenter
SSIS|Microsoft SQL Server Integration Services
SSRS|Microsoft SQL Server Reporting Services
Talend
Azure Data Factory|ADF|Microsoft Azure Data Factory
Microsoft Fabric
Power Query
DAX
Predictive modeling|predictive modelling|predictive analytics
Pivot tables|pivot table
VLOOKUP|XLOOKUP|HLOOKUP
Google Analytics|GA4|Google Analytics 4
Mixpanel
Amplitude
Exploratory data analysis|EDA analysis
Data governance
Business intelligence|BI`,
  "ai-ml": `
Machine learning|ML
Deep learning
NLP|Natural Language Processing
Computer vision
LLMs|LLM|Large Language Models|large language model
Generative AI|GenAI|Gen AI
Prompt engineering
RAG|Retrieval-Augmented Generation|retrieval augmented generation
LangChain
LangGraph
LlamaIndex
Hugging Face|HuggingFace|Hugging Face Transformers
OpenAI API|OpenAI
Fine-tuning|fine tuning|LoRA|PEFT
TensorFlow
PyTorch
Keras
scikit-learn|sklearn|scikit learn|Scikit-learn
XGBoost
LightGBM
OpenCV
YOLO
CNN|CNNs|convolutional neural networks
RNN|LSTM|recurrent neural networks
Transformers|transformer models|~BERT
Neural networks|neural network|ANN
Reinforcement learning
MLOps
MLflow
Kubeflow
Feature engineering
Model deployment|model serving
AI agents|agentic AI|LLM agents
Embeddings|vector search|semantic search
Recommendation systems|recommender systems|recommendation engine
NLTK
spaCy
Stable Diffusion|diffusion models
Vertex AI|Google Vertex AI
Amazon SageMaker|SageMaker|AWS SageMaker|Amazon Web Services AWS SageMaker
Data science
Artificial intelligence|AI`,
  security: `
Cybersecurity|cyber security|information security|InfoSec
Network security
Penetration testing|pentesting|pen testing|VAPT
OWASP|OWASP Top 10
Burp Suite|Portswigger BurP Suite
Metasploit
Nmap
Wireshark
Kali Linux
SIEM
Cryptography|encryption
Vulnerability assessment|vulnerability management
ISO 27001
Ethical hacking
Firewalls|firewall
Single sign-on|SSO
SOC 2`,
  design: `
Figma
~Sketch
Adobe XD|XD
Adobe Photoshop|Photoshop
Adobe Illustrator|Illustrator
Adobe InDesign|InDesign
Adobe After Effects|After Effects
Adobe Premiere Pro|Premiere Pro
Adobe Creative Suite|Adobe Creative Cloud|Adobe Creative Cloud software
Adobe Lightroom|Lightroom|Adobe Photoshop Lightroom
Canva
~Framer
InVision|InVision software
Zeplin
Blender
UI design|user interface design|UI designer skills
UX design|user experience design|user experience
UI/UX|UI UX|UX/UI|UI/UX design
Wireframing|wireframes|wireframe
Prototyping|prototypes|rapid prototyping
User research|UX research
Usability testing
Design systems|design system
Interaction design
Information architecture
Visual design
Typography
Motion design|motion graphics
Graphic design
Design thinking
Miro
Final Cut Pro|Apple Final Cut Pro
DaVinci Resolve
Video editing`,
  product: `
Product management
Product strategy
Product roadmap|roadmapping|roadmaps|product roadmaps
Product discovery
User stories|user story
PRD|product requirements document|PRDs
Agile|Agile methodology|Agile methodologies|Agile development
Scrum|Scrum Master
Kanban
Jira|JIRA|Atlassian JIRA|Atlassian Jira
Confluence|Atlassian Confluence
Asana
Trello
~Notion
Market research
Competitive analysis|competitor analysis|competitive landscape
OKRs|OKR
KPIs|KPI|key performance indicators
Product analytics
Customer journey mapping|journey mapping|user journey mapping
Requirements gathering|requirement gathering|requirements analysis
Waterfall|Waterfall methodology
Project management|project planning
Program management
Business analysis
Process improvement|process optimization
Root cause analysis|RCA
Microsoft Project|MS Project
PMP|Project Management Professional
Product lifecycle management|product lifecycle|PLM
Go-to-market|GTM|go-to-market strategy|go to market|go to market strategy
Unit economics
Pricing strategy|pricing`,
  finance: `
Financial modeling|financial modelling|financial models|financial model
Valuation|valuations|company valuation|business valuation
DCF|discounted cash flow|DCF valuation|DCF modeling
LBO|leveraged buyout|LBO modeling
M&A|mergers and acquisitions|mergers & acquisitions|M&A advisory
Comparable company analysis|comps|trading comps|comparable companies|comps analysis
Precedent transactions|precedent transaction analysis|transaction comps
Financial analysis
Financial statement analysis|financial statements|three-statement model|3-statement model
Financial reporting
Accounting|accountancy
Bookkeeping|book keeping
Accounts payable
Accounts receivable
General ledger|GL accounting
Reconciliation|bank reconciliation|reconciliations
Budgeting|budget planning
Forecasting|financial forecasting
FP&A|financial planning and analysis|FP and A
Variance analysis
Cash flow management|cash flow analysis|cash flow forecasting
Working capital management|working capital
Corporate finance
Equity research
Credit analysis|credit appraisal|credit assessment
Credit risk|credit risk analysis|credit risk management
Market risk
Risk management|financial risk management
Portfolio management
Asset management
Wealth management
Investment banking
Private equity
Venture capital
Capital markets|ECM|DCM
Derivatives
Fixed income|bonds
Equities|equity markets|stock markets
Treasury|treasury management
Internal audit|internal auditing
Statutory audit|external audit|audit|auditing
IFRS
Ind AS
GAAP|US GAAP
Taxation|direct tax|indirect tax|direct taxation|indirect taxation
GST|Goods and Services Tax|GST compliance|GST filing|GST returns
TDS|tax deducted at source
Income tax|income tax returns|ITR filing
~Tally|Tally ERP|Tally ERP 9|Tally Prime|TallyPrime|Tally ERP9
Zoho Books
QuickBooks|Intuit QuickBooks
SAP FICO|SAP FI/CO|SAP FI|SAP CO
Bloomberg Terminal|Bloomberg
Capital IQ|S&P Capital IQ|CapIQ
FactSet
Refinitiv|Refinitiv Eikon|Thomson Reuters Eikon|LSEG Workspace
PitchBook
Pitch books|pitch decks|pitch deck|pitchbooks
Due diligence|financial due diligence|DD
Ratio analysis|financial ratios
Cost accounting|cost analysis
MIS reporting|MIS reports|MIS
Payroll|payroll processing
CFA|Chartered Financial Analyst|CFA Level 1|CFA Level I
Chartered Accountancy|Chartered Accountant|CA Inter|CA Final|CA Intermediate
FRM|Financial Risk Manager
ACCA
CPA
NISM|NISM certification
Financial markets
Investment analysis|investment research
Mutual funds
Insurance|insurance products`,
  banking: `
Retail banking
Corporate banking
KYC|Know Your Customer|KYC compliance
AML|anti-money laundering|anti money laundering|AML compliance
Credit underwriting|underwriting|loan underwriting
Trade finance
Basel III|Basel norms|Basel
RBI regulations|RBI guidelines|RBI compliance
Banking operations|bank operations
Core banking|core banking systems|CBS
Finacle|Infosys Finacle
Payment systems|payments domain|payments
UPI
Regulatory compliance|compliance
Fraud detection|fraud analytics|fraud prevention
Loan processing|loan origination
Cross-selling|cross selling|upselling
Relationship management|client relationship management
NPA management|NPA
Credit cards|cards domain`,
  consulting: `
Management consulting
Strategy consulting
Business strategy|corporate strategy|strategic planning
Market sizing
Process mapping|process maps
Benchmarking
Porter's Five Forces|Porters Five Forces|five forces
SWOT analysis|SWOT
Business process re-engineering|BPR|business process reengineering
Supply chain management|SCM|supply chain
Operations management|operations
Lean|Lean methodology|Lean principles|Lean manufacturing
Six Sigma|Lean Six Sigma|Six Sigma Green Belt|Six Sigma Black Belt
Change management
Digital transformation
Market entry strategy|market entry
Cost optimization|cost reduction
Business case development|business cases|business case
Client management|client servicing
Hypothesis-driven problem solving|hypothesis driven|issue trees|MECE
Executive presentations|executive communication`,
  marketing: `
Digital marketing
SEO|search engine optimization|search engine optimisation
SEM|search engine marketing
Google Ads|Google AdWords|AdWords
Meta Ads|Facebook Ads|Facebook Ads Manager|Meta Ads Manager|Instagram Ads
Social media marketing|SMM|social media management
Content marketing
Content strategy
Copywriting|copy writing
Content writing
Email marketing
Marketing automation
HubSpot|HubSpot software|HubSpot CRM
Salesforce|Salesforce CRM|Salesforce software
Zoho CRM
Mailchimp
CRM|customer relationship management
Performance marketing
Growth marketing|growth hacking
Brand management|branding
Brand strategy
Marketing analytics
Google Tag Manager
Semrush|SEMrush
Ahrefs|Ahrefs Site Explorer
Moz
Influencer marketing
Affiliate marketing
Campaign management|campaign planning
PPC|pay-per-click|pay per click
Conversion rate optimization|CRO|conversion optimization
Lead generation
Marketing strategy
Public relations
Product marketing
Customer segmentation|market segmentation|segmentation
Consumer insights|consumer behaviour|consumer behavior
Business development
Key account management|account management|KAM
B2B sales|B2B marketing
Sales|inside sales|field sales
Shopify|Shopify software
WordPress
Webflow
Google Search Console
Adobe Analytics
Marketo|Marketo Marketing Automation
Hootsuite
Market analysis
E-commerce|ecommerce
Customer acquisition|user acquisition
Retention marketing|customer retention
Marketing funnels|sales funnel|funnel analysis
Event management|event marketing`,
  office: `
!Excel|Microsoft Excel|MS Excel|Advanced Excel|MS-Excel|Excel modeling|Excel modelling
Microsoft Word|MS Word|MS-Word
PowerPoint|Microsoft PowerPoint|MS PowerPoint|PPT|MS-PowerPoint
Microsoft Office|MS Office|Office 365|Microsoft 365|Microsoft Office software|MS Office Suite
~Outlook|Microsoft Outlook|MS Outlook
Google Workspace|G Suite|GSuite|Google Workspace software
Google Docs
Google Slides
Microsoft Teams|MS Teams
~Slack
~Zoom
Microsoft Visio|Visio
SharePoint|Microsoft SharePoint
Power Automate|Microsoft Power Automate
Power Apps|PowerApps|Microsoft Power Apps
Microsoft Access|MS Access
VS Code|Visual Studio Code|VSCode
Visual Studio|Microsoft Visual Studio
IntelliJ IDEA|IntelliJ
Eclipse IDE|~Eclipse
~Vim|Neovim
LaTeX|Overleaf
Markdown
Adobe Acrobat
SAP|SAP ERP|SAP software
SAP S/4HANA|S/4HANA|S4 HANA
Oracle NetSuite|NetSuite
Microsoft Dynamics|Dynamics 365|Microsoft Dynamics 365
Workday|Workday software
ServiceNow
Zoho
Odoo
Typing|typing speed`,
  soft: `
Communication|communication skills|verbal communication|written communication|communicate effectively|oral communication|excellent communication
Teamwork|team work|work in teams|team player|teamwork principles|working in teams
Collaboration|cross-functional collaboration|collaborate|collaborative|cross-functional teams
Leadership|lead others|team leadership|leadership skills|leading teams
People management|team management|managing teams|manage a team|manage teams
Problem solving|problem-solving|solve problems|problem solver|problem solving skills
Critical thinking|think critically|critical thinker
Analytical skills|analytical thinking|analytical mindset|analytical
Attention to detail|detail-oriented|eye for detail|meticulous|attention to details
Time management|manage time|meet deadlines|meeting deadlines
Adaptability|adaptable|adapt to change|flexibility|flexible
Creativity|creative thinking|think creatively|creative
Ownership|take ownership|sense of ownership|ownership mindset|bias for action
Initiative|self-starter|self starter|proactive|take initiative|take the initiative
Stakeholder management|stakeholder engagement|manage stakeholders|stakeholder communication
Presentation skills|presentation|presentations|present findings
Public speaking|address an audience|speak in public
Negotiation|negotiate|negotiation skills|negotiate compromise
Interpersonal skills|interact with others|people skills|interpersonal
Mentoring|mentorship|coaching|instruct others|mentor others|mentor junior
Decision making|decision-making|make decisions|take decisions
Work ethic|strong work ethic|work ethics
Customer focus|customer orientation|customer-centric|customer obsession|customer centricity|client focus
Emotional intelligence|empathy|show empathy|empathetic
Conflict resolution|resolve conflicts|manage conflict|conflict management
Accountability|accountable
Prioritization|prioritisation|prioritize tasks|prioritise tasks|prioritize|prioritise
Multitasking|multi-tasking|multitask|juggle multiple
Willingness to learn|eager to learn|learning agility|quick learner|fast learner|continuous learning|growth mindset
Curiosity|curious|intellectually curious|intellectual curiosity
Resilience|work under pressure|ability to work under pressure|cope with pressure|thrive under pressure|handle pressure
Organizational skills|organisational skills|organized|organised|well organized|well-organized
Storytelling|data storytelling|tell stories
Business acumen|commercial awareness|commercial acumen|business sense
Strategic thinking|think strategically|strategic mindset
Persuasion|persuade others|influencing|influence others|influencing skills
Self-motivation|self-motivated|self motivated|highly motivated|motivated
Integrity|ethical|honesty
Active listening|listening skills|listen actively
Intercultural competence|demonstrate intercultural competence|cross-cultural communication|cultural awareness
Teaching|teach|tutoring
Independent work|work independently|independently|autonomy|autonomous
Ambiguity tolerance|deal with ambiguity|comfortable with ambiguity|navigate ambiguity|ambiguity
Client handling|client facing|client-facing|customer facing|customer-facing
Written skills|writing skills|business writing|report writing
Team building|build teams|build a team
Problem analysis|structured thinking|structured problem solving|first principles thinking`,
};

const ONET_CATEGORY: [RegExp, string][] = [
  [
    /spreadsheet|word processing|presentation|office suite|electronic mail|desktop publishing|document management/i,
    "office",
  ],
  [/accounting|financial|tax|risk management/i, "finance"],
  [/customer relationship|sales and marketing|web page creation/i, "marketing"],
  [/enterprise resource|human resources|procurement|time accounting/i, "office"],
  [/data base|metadata|backup|storage/i, "database"],
  [/business intelligence|data mining|analytical or scientific/i, "data"],
  [/graphics|video|graphical user interface|process mapping/i, "design"],
  [/web platform/i, "frontend"],
  [/program testing/i, "testing"],
  [/security|virus|authentication|firewall/i, "security"],
  [/cloud|configuration management|application server|network|operating system|clustering|switch|lan /i, "devops"],
  [/project management|requirements analysis|content workflow/i, "product"],
  [/development environment|object or component|compiler|enterprise application integration|transaction/i, "backend"],
];
const ONET_DENY =
  /medical|computer aided|geographic|map creation|industrial control|facilities|point of sale|inventory|training|educational|location based|helpdesk|instant messaging|internet browser|video conferencing|calendar|optical character|ip multimedia|charting|library/i;
const NAME_DENY = new Set(
  "Oracle|Ada|Scheme|Eko|Canu|Amadeus|Google|Facebook|TikTok|LinkedIn|YouTube|Instagram|Twitter|X|Snapchat|Pinterest|WhatsApp|Apple Safari|Mozilla Firefox|Microsoft Edge|Google Chrome|Microsoft Windows|Apple macOS|Web browser software|Email software".split(
    "|",
  ),
);
const VENDORS =
  /^(?:Amazon Web Services AWS|Amazon|Microsoft|Oracle|Apache|Atlassian|Google|Apple|Adobe|IBM|Intuit|Autodesk|Dassault Systemes|Red Hat|Cisco|Meta|The MathWorks|MathWorks|StataCorp|Unity Technologies|Unreal Technology|TechSmith|Maxon|SideFX|Portswigger|Tenable|Qualys|Grafana Labs|Elastic|SAP|Salesforce|Infosys) /;
// Relevant O*NET occupations: computer and math, business and finance, marketing and ops managers,
// designers, media, finance sales and financial clerks.
const RELEVANT_SOC = /^(?:15-|13-|11-2|11-3|27-1|27-3|41-3|43-3)/;

// A name safe to match case-insensitively: several words, or it carries an inner capital, digit or symbol.
const safeAlias = (name: string) => name.includes(" ") || /[A-Z0-9.+#/-]/.test(name.slice(1));
const clean = (name: string) =>
  name
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+software$/i, "")
    .trim();

function parseCore(): Skill[] {
  return Object.entries(CORE).flatMap(([category, block]) =>
    block
      .trim()
      .split("\n")
      .map((line) => {
        const names = line.split("|").map((n) => n.trim());
        const cased = names.filter((n) => n.startsWith("~")).map((n) => n.slice(1));
        const bare = names.map((n) => n.replace(/^[!~]/, ""));
        return {
          name: bare[0]!,
          aliases: bare.slice(1),
          kind: category === "soft" ? "soft" : "hard",
          category,
          source: ["core"],
          ...(names[0]!.startsWith("!") ? { ambiguous: true as const } : {}),
          ...(cased.length ? { cased } : {}),
        };
      }),
  );
}

async function cached(file: string, fetchText: () => Promise<string>) {
  const url = new URL(file, CACHE);
  try {
    return await readFile(url, "utf8");
  } catch {
    const text = await fetchText();
    await writeFile(url, text);
    return text;
  }
}

async function get(url: string) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`${response.status} for ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
}

type OnetProduct = { name: string; names: string[]; category: string; createable: boolean };

async function onetProducts(): Promise<OnetProduct[]> {
  const text = await cached(`onet-${ONET_VERSION}.txt`, () => get(ONET_URL));
  const products = new Map<string, { flagged: boolean; socs: Set<string>; commodity: string; denied: boolean }>();
  for (const line of text.replace(/\r/g, "").split("\n").slice(1)) {
    const [soc, example, , commodity, hot, inDemand] = line.split("\t");
    if (!soc || !example || !commodity) continue;
    const product = products.get(example) ?? { flagged: false, socs: new Set(), commodity, denied: false };
    product.flagged ||= hot === "Y" || inDemand === "Y";
    product.denied ||= ONET_DENY.test(commodity);
    if (RELEVANT_SOC.test(soc)) product.socs.add(soc);
    products.set(example, product);
  }
  return (
    [...products]
      .filter(([name, p]) => (p.flagged || p.socs.size >= 4) && !p.denied && !NAME_DENY.has(clean(name)))
      // Widely used but unflagged products only add names to known skills; most are legacy (Lotus 1-2-3).
      .map(([raw, p]) => {
        let base = clean(raw);
        const names = [base];
        const acronym = /^(.+) ([A-Z][A-Z0-9]+)$/.exec(base);
        if (acronym) {
          base = acronym[1]!;
          names.push(acronym[2]!, base);
        }
        names.push(...names.map((n) => n.replace(VENDORS, "")));
        return {
          name: base,
          names: [...new Set(names)],
          category: ONET_CATEGORY.find(([pattern]) => pattern.test(p.commodity))?.[1] ?? "tools",
          // "Accounting software" or "Chatbot software" names a category, not a product.
          createable:
            p.flagged &&
            p.socs.size >= 2 &&
            !(raw.includes(" ") && !/[A-Z0-9]/.test(raw.slice(1))) &&
            base.length > 2 &&
            !NAME_DENY.has(base),
        };
      })
  );
}

type EscoConcept = {
  preferredLabel?: { en?: string };
  alternativeLabel?: { en?: string[] };
  _links: Record<string, { uri: string }[] | unknown>;
};

async function escoConcepts(): Promise<{ ict: EscoConcept[]; soft: EscoConcept[] }> {
  const json = await cached("esco.json", async () => {
    const fetchConcept = async (uri: string, kind = "concept") =>
      JSON.parse(await get(`${ESCO_API}/${kind}?uri=${encodeURIComponent(uri)}&language=en`)) as EscoConcept;
    const links = (concept: EscoConcept, rel: string) =>
      ((concept._links[rel] ?? []) as { uri: string }[]).map((l) => l.uri);
    const fetchAll = async (uris: string[]) => {
      const out: EscoConcept[] = [];
      for (let i = 0; i < uris.length; i += 8)
        out.push(...(await Promise.all(uris.slice(i, i + 8).map((uri) => fetchConcept(uri, "skill")))));
      return out;
    };
    const groups = await Promise.all(ESCO_ICT_GROUPS.map((uri) => fetchConcept(uri)));
    const ict = await fetchAll(groups.flatMap((g) => links(g, "narrowerSkill")));
    const scheme = JSON.parse(
      await get(`${ESCO_API}/taxonomy?uri=${encodeURIComponent(ESCO_TRANSVERSAL)}&language=en`),
    ) as EscoConcept;
    const top = await Promise.all(links(scheme, "hasTopConcept").map((uri) => fetchConcept(uri)));
    const soft = await fetchAll([...new Set(top.flatMap((t) => links(t, "narrowerSkill")))]);
    const slim = (c: EscoConcept) => ({
      preferredLabel: { en: c.preferredLabel?.en },
      alternativeLabel: { en: c.alternativeLabel?.en ?? [] },
      _links: {},
    });
    return JSON.stringify({ ict: ict.map(slim), soft: soft.map(slim) });
  });
  return JSON.parse(json) as { ict: EscoConcept[]; soft: EscoConcept[] };
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  const skills = parseCore();
  const byKey = new Map<string, Skill>();
  const claim = (skill: Skill, name: string) => {
    const key = nameKey(name);
    if (!key || byKey.has(key)) return false;
    byKey.set(key, skill);
    return true;
  };
  for (const skill of skills) {
    for (const name of [skill.name, ...skill.aliases])
      if (!claim(skill, name) && byKey.get(nameKey(name)) !== skill)
        console.warn(`core: "${name}" already belongs to ${byKey.get(nameKey(name))?.name}`);
  }

  // Merges into a known skill when any form of the name is already known, else adds a new one.
  const merge = (names: string[], source: string, create: () => Omit<Skill, "aliases" | "source"> | null) => {
    const known = names.map((n) => byKey.get(nameKey(n))).find(Boolean);
    const skill = known ?? create();
    if (!skill) return;
    const target: Skill = known ?? { ...skill, aliases: [], source: [] };
    if (!known) {
      skills.push(target);
      claim(target, target.name);
    }
    if (!target.source.includes(source)) target.source.push(source);
    for (const name of names) if (safeAlias(name) && claim(target, name)) target.aliases.push(name);
  };
  // A single plain word from an outside list ("Hadoop", "Puppet") only matches in its own case.
  const plain = (name: string) => (safeAlias(name) ? {} : { cased: [name] });

  for (const product of await onetProducts())
    merge(product.names, "onet", () =>
      !product.createable
        ? null
        : { name: product.name, kind: "hard", category: product.category, ...plain(product.name) },
    );

  const esco = await escoConcepts();
  // ESCO's ICT knowledge is mostly obscure tools (BlackArch, Codenvy), so it only adds names to known skills,
  // and only names that contain the preferred label ("Adobe Illustrator CS6"), not loose ones ("MVC" for ASP.NET).
  for (const concept of esco.ict) {
    const label = clean(concept.preferredLabel?.en ?? "");
    const key = nameKey(label);
    const alternatives = (concept.alternativeLabel?.en ?? []).map(clean);
    if (key) merge([label, ...alternatives.filter((n) => ` ${nameKey(n)} `.includes(` ${key} `))], "esco", () => null);
  }
  // ESCO transversal skills are verb phrases ("work in teams"); an alternative label joins only when it shares a
  // word with the preferred one ("make decisions" for "make decision", not "anticipate needs" for creativity).
  const STOP = new Set(["a", "an", "the", "and", "of", "to", "in", "with", "others", "own", "for"]);
  const words = (name: string) =>
    nameKey(name)
      .split(" ")
      .filter((w) => !STOP.has(w));
  for (const concept of esco.soft) {
    const label = concept.preferredLabel?.en ?? "";
    if (!label || label.split(" ").length > 4) continue;
    const own = new Set(words(label));
    const alternatives = (concept.alternativeLabel?.en ?? []).filter(
      (n) => n.split(" ").length >= 2 && n.split(" ").length <= 4 && words(n).some((w) => own.has(w)),
    );
    merge([label, ...alternatives], "esco", () => ({ name: label, kind: "soft", category: "soft" }));
  }

  const byName = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" }) || a.localeCompare(b);
  const output = skills
    .map((s) => ({ ...s, aliases: [...new Set(s.aliases)].sort(byName) }))
    .sort((a, b) => byName(a.name, b.name));
  const json = await format(JSON.stringify(output), { parser: "json", printWidth: 120 });
  await writeFile(OUT, json);

  const counts = new Map<string, number>();
  for (const s of output) counts.set(`${s.kind}/${s.category}`, (counts.get(`${s.kind}/${s.category}`) ?? 0) + 1);
  console.log(`${output.length} skills, ${(json.length / 1024).toFixed(0)} KB`);
  console.log(
    [...counts]
      .sort()
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  );
}

await main();
