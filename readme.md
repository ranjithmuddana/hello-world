Opal‑like Workflow Tool — Architecture & Sequence Blueprint

Internal workflow automation platform for DEV, QA, and PO teams integrating GitHub, Jira, SonarQube, Fortify, and Google Vertex AI.

⸻

1) High‑Level Objectives
	•	Enforce standardized, auditable SDLC workflows across teams
	•	Orchestrate Jira‑driven development with GitHub, CI, quality gates (Sonar/Fortify), and testing (JUnit/Playwright)
	•	Provide PO/QA friendly UI and summaries
	•	Embed AI assistance via Vertex AI for code/test suggestions and PR/Jira summaries

⸻

2) Reference Tech Stack
	•	Frontend: React + Tailwind + shadcn/ui; Playwright for UI tests
	•	Backend: Spring Boot (Java/Kotlin)
	•	Workflow Orchestration: Temporal or Camunda/Zeebe (choose one)
	•	CI: GitHub Actions (or Jenkins/GitLab CI); ArgoCD for K8s deploy
	•	Quality/Sec: SonarQube, Fortify SCA/SAST
	•	AI: Google Vertex AI (Text, Code, and Summarization models)
	•	Data: PostgreSQL (state/audit), Redis (cache/rate‑limit), MinIO/GCS (artifacts)
	•	Auth: Enterprise SSO (OIDC/SAML), RBAC/ABAC
	•	Runtime: Kubernetes + Istio/Linkerd (optional), OpenTelemetry for tracing

⸻

3) System Architecture (Component Diagram)

flowchart TB
  subgraph Clients
    PO[Product Owner]
    DEV[Developer]
    QA[QA Engineer]
  end

  subgraph UI[Web App]
    FE[React SPA (Tailwind/shadcn)]
  end

  subgraph Core[Workflow Platform]
    API[API Gateway / BFF]
    AUTH[SSO + RBAC]
    ORCH[Workflow Engine (Temporal/Camunda)]
    SVC[Workflow Service (Spring Boot)]
    GHC[GitHub Connector]
    JRC[Jira Connector]
    SNC[Sonar Connector]
    FRC[Fortify Connector]
    AIC[Vertex AI Adapter]
    NOTIF[Notifier (Slack/Email/Teams)]
  end

  subgraph Data[Persistence]
    PG[(PostgreSQL)]
    RDS[(Redis)]
    OBJ[(Artifact Store: MinIO/GCS)]
  end

  subgraph CI[CI/CD]
    GHA[GitHub Actions / Jenkins]
    SONAR[SonarQube]
    FORT[Fortify]
    ARGO[ArgoCD]
  end

  Clients --> FE
  FE -->|GraphQL/REST| API
  API --> AUTH
  API --> SVC
  SVC --> ORCH
  SVC --> GHC
  SVC --> JRC
  SVC --> SNC
  SVC --> FRC
  SVC --> AIC
  SVC --> NOTIF

  SVC <--> PG
  SVC <--> RDS
  GHA <--> SONAR
  GHA <--> FORT
  GHA --> ARGO
  GHC <--> GHA

  GHC <-->|Webhooks| API
  SONAR --> SNC
  FORT --> FRC

Notes
	•	Prefer webhooks (GitHub) → API Gateway → enqueue jobs in ORCH
	•	Connectors are stateless; all tokens/secrets managed via Vault/KMS
	•	Sonar/Fortify results are polled or webhook‑driven into SVC, stored in PG, surfaced in UI

⸻

4) End‑to‑End Workflow (Sequence Diagram)

sequenceDiagram
  autonumber
  participant PO as Product Owner
  participant UI as Web UI
  participant JIRA as Jira
  participant WF as Workflow Svc (API+Orch)
  participant GIT as GitHub
  participant CI as CI (GHA/Jenkins)
  participant SON as SonarQube
  participant FOR as Fortify
  participant AI as Vertex AI
  participant QA as QA

  PO->>UI: Create/Refine Story (acceptance criteria)
  UI->>JIRA: Create/Update ticket (labels, DoD)
  PO->>WF: Start workflow from story
  WF->>GIT: Create branch + PR template
  Note over WF,AI: Optional: AI suggests subtasks, PR description, test ideas

  DEV->>GIT: Push commits (feature/*)
  GIT-->>WF: Webhook: PR updated
  WF->>CI: Trigger pipeline (JUnit, Playwright, Build)
  CI->>SON: Sonar scan
  CI->>FOR: Fortify scan
  SON-->>WF: Quality gate result (webhook/poll)
  FOR-->>WF: Security results
  CI-->>WF: Test results + artifacts
  WF->>JIRA: Update ticket (status, links, summary)
  WF->>AI: Summarize PR + suggest fixes
  AI-->>WF: Summary + code/test suggestions
  WF->>GIT: Comment on PR with summary, failed gates, fix hints

  alt Any gate fails
    WF->>DEV: Notify (Slack/Email) + assign back in Jira
    DEV->>GIT: Push fixes
    GIT-->>WF: Webhook; loop pipeline
  end

  opt All gates pass
    WF->>GIT: Mark "Ready for Review"; enforce approvals
    QA->>UI: Review test evidence
    QA->>JIRA: Approve QA step
    PO->>JIRA: Approve/Accept
    WF->>GIT: Merge PR (policy checks)
    WF->>CI: Release pipeline → ARGO deploy
    WF->>JIRA: Auto close / release notes
  end


⸻

5) Data Model (ERD)

erDiagram
  USER ||--o{ MEMBERSHIP : has
  TEAM ||--o{ MEMBERSHIP : has
  TEAM ||--o{ REPO : owns
  REPO ||--o{ WORKFLOW_RUN : has
  JIRA_ISSUE ||--o{ WORKFLOW_RUN : triggers
  WORKFLOW_RUN ||--o{ CI_JOB : includes
  WORKFLOW_RUN ||--o{ QUALITY_GATE : evaluates
  QUALITY_GATE ||--o{ ISSUE_FINDING : aggregates

  USER {
    uuid id PK
    string sso_id
    string email
    string role // DEV/QA/PO/Admin
  }
  TEAM { uuid id PK, string name }
  MEMBERSHIP { uuid id PK, uuid user_id FK, uuid team_id FK, string role }
  REPO { uuid id PK, string provider, string org, string name }
  JIRA_ISSUE { uuid id PK, string key, string status, jsonb meta }
  WORKFLOW_RUN { uuid id PK, uuid repo_id FK, uuid issue_id FK, string pr_number, string status, timestamptz started_at, timestamptz finished_at }
  CI_JOB { uuid id PK, uuid run_id FK, string name, string status, text log_uri }
  QUALITY_GATE { uuid id PK, uuid run_id FK, string type // sonar/fortify, string status, jsonb summary }
  ISSUE_FINDING { uuid id PK, uuid gate_id FK, string severity, string rule, text file, int line, text message }


⸻

6) API Surface (Representative)

Gateway/BFF (REST/GraphQL)
	•	POST /workflows/start → body: {jiraKey, repoId, templateId}
	•	GET /workflows/{runId} → status, gates, links
	•	POST /hooks/github → PR/commit webhooks
	•	POST /hooks/sonar / POST /hooks/fortify
	•	POST /ai/summarize (internal) → PR/Jira context
	•	GET /reports/leadtime?team=...&from=...&to=...

Security: OIDC auth; per‑team RBAC; signed webhook secrets; least‑priv PATs; Vault for creds

⸻

7) Quality Gates & Policies
	•	Build & Unit Tests (JUnit): min coverage (e.g., 80%), no failing tests
	•	UI Tests (Playwright): smoke suite must pass
	•	SonarQube: no new critical/blocker issues; coverage on new code ≥ threshold; maintainability rating ≥ B
	•	Fortify: no high/critical vulnerabilities; SCA policy compliant
	•	PR Reviews: at least N reviewers; code owner paths enforced
	•	Jira Sync: PR must reference Jira key; state transitions automated

⸻

8) CI/CD Blueprints (Sketched)

GitHub Actions

name: pr
on:
  pull_request:
    branches: [ main ]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - name: Build & Unit Tests
        run: ./mvnw -B clean verify
      - name: Upload JUnit
        if: always()
        uses: actions/upload-artifact@v4
        with: { name: junit, path: '**/surefire-reports/*.xml' }
      - name: Sonar Scan
        uses: SonarSource/sonarcloud-github-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      - name: Fortify SAST
        run: |
          fortify-sast scan --build ./target --project $GITHUB_REPOSITORY --out results.fpr
      - name: Notify Workflow Svc
        run: curl -X POST "$WORKFLOW_SVC/hooks/ci" -H "Authorization: Bearer $TOKEN" -d @payload.json

Playwright Test (separate job or nightly)

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npx playwright install --with-deps
      - run: npx playwright test --reporter=junit


⸻

9) AI Assistance (Vertex AI) — Use Cases
	•	PR/Jira Summaries: condense change sets & link to acceptance criteria
	•	Test Suggestions: propose JUnit/Playwright tests from diffs
	•	Fix Hints: generate code snippets addressing Sonar/Fortify rules
	•	Release Notes: compile from merged PRs and Jira labels

Safety & Guardrails
	•	Run AI suggestions in “proposal” mode; never auto‑commit without human approval
	•	Log prompts/outputs; redact secrets; enable content filters

⸻

10) Governance, Audit, and Observability
	•	Audit Log: all transitions (who, what, when) in PG (append‑only)
	•	Dashboards: DORA metrics (lead time, MTTR, change failure rate), coverage, vuln trends
	•	Tracing/Metrics: OpenTelemetry → Prometheus/Grafana
	•	Backup/DR: PG PITR, artifact retention policies

⸻

11) Rollout Plan
	1.	Connectors: Jira + GitHub + basic PR webhooks
	2.	Unit tests + Sonar gate; show in UI
	3.	Add Fortify; wire Slack/Email notifications
	4.	Add Playwright; then PO/QA approval screens
	5.	Introduce AI summaries; later test/fix suggestions
	6.	Scale to multi‑team with templates and RBAC

⸻

12) Open Decisions
	•	Temporal vs Camunda (ops & developer ergonomics)
	•	Central Sonar/Fortify vs per‑team instances
	•	Where to run Playwright (ephemeral env vs shared staging)
	•	AI model mix (code vs text models) and prompt governance