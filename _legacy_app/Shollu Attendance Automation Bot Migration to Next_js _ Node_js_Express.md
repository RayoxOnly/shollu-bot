# Shollu Attendance Automation Bot Migration to Next.js & Node.js/Express

### TL;DR

This project migrates the Shollu auto-attendance bot from an ad-hoc, fragile codebase to a robust and maintainable architecture, combining Next.js for a future-proof dashboard UI and Node.js/Express for bot automation logic. The solution focuses on stability and extensibility, optimized for self-hosting by technically capable students using a teacher account, and is designed to enable effortless open-source collaboration and easy UI improvements.

---

## Goals

### Business Goals

* Achieve a maintainable, modular codebase that is easy to update and extend.

* Make the project accessible for self-hosted, open-source contributions.

* Enable UI improvements through a clean separation between frontend and backend.

* Decrease support burden by reducing bot breakages or run issues.

* Provide clear documentation and contributor pathways to streamline onboarding.

### User Goals

* Enable technically capable students to automate attendance reliably with easy local setup.

* Minimize manual intervention and reduce time spent babysitting the script.

* Allow users to monitor bot status and troubleshoot quickly when needed.

* Make it straightforward for contributors to understand and extend the codebase.

### Non-Goals

* Implementing an authentication system or granular multi-user support.

* Deploying as a public web service—self-hosted/local use only.

* Supporting advanced permissions, audit logs, or enterprise workflows.

---

## User Stories

**Student-Operator**

* As a student-operator, I want to automate shollu attendance with minimal manual effort, so that I save time and avoid daily repetitive work.

* As a student-operator, I want to view the current status and logs of the automation bot from a simple dashboard, so that I can verify it’s running and spot problems easily.

* As a student-operator, I want to trigger attendance manually and see scheduling info, so that I have quick control and visibility over the process.

**Contributor**

* As a contributor, I want to understand and extend the codebase without wading through messy legacy scripts, so that I can efficiently add features or fix bugs.

* As a contributor, I want documentation and logical folder structure, so that onboarding is fast and less error-prone.

---

## Functional Requirements

* **Migration and Refactor** (Priority: High)

  * Modularize bot automation code; standardize interfaces and separate concerns.

  * Codebase reproducible via local setup scripts (e.g., minimal `npm install`, env config).

  * Clean project scaffolding: clear folder/domain boundaries between bot logic and frontend UI.

  * Include basic configuration management (config file/environment variables).

* **Dashboard UI** (Priority: Medium)

  * Home/status page: display automation status (e.g., running, last run time).

  * Error log view: surface errors or stack traces to users.

  * Manual trigger button for bot automation.

  * Simple scheduling view: show next/last scheduled runs.

* **Bot Management** (Priority: Medium)

  * Simple process control (start/stop).

  * Exposed endpoints for UI to fetch status/logs or invoke automation.

  * Unified logging (stored locally, accessible by UI).

* **Out of Scope**

  * No advanced multi-user support or granular authentication.

  * Not designed for public deployment.

  * No integrations beyond what is required for the Shollu attendance use case.

---

## User Experience

**Entry Point & First-Time User Experience**

* Users discover the project via GitHub, open-source documentation, or peer recommendations.

* Upon cloning the repository, clear `README.md` provides setup steps:

  * Install Node.js if needed

  * Run `npm install` (or equivalent)

  * Configure local settings via provided `.env.example` or `config.json`

* Documentation points users to relevant scripts, configuration tips, and troubleshooting steps.

**Core Experience**

* **Step 1:** User starts the unified development process (`npm run dev` or similar).

  * Prompts user if config/credentials are missing or incorrect; fails gracefully with clear error.

  * Suggests documentation links for troubleshooting.

* **Step 2:** User visits the local dashboard (`http://localhost:3000`) in any browser.

  * Home view shows current bot status (idle, running, last run, next scheduled run).

  * Prominent log/errors panel for at-a-glance health checks.

* **Step 3:** User may trigger the bot automation manually via dashboard.

  * UI gives real-time feedback: in-progress spinner, then success/failure and log excerpt.

* **Step 4:** If errors occur, logs are surfaced immediately and suggest likely fixes or configuration issues.

  * Users can seek help or contribute fixes based on clearly surfaced error details.

* **Step 5:** Contributors can follow code structure and inline documentation to add features or debug.

**Advanced Features & Edge Cases**

* Graceful handling of invalid configs, missing dependencies, or network errors.

* Ability to clear logs or reset bot state from UI or config.

* Supports both Windows and Unix-based local environments where possible.

**UI/UX Highlights**

* Dashboard prioritizes actionable status and real-time logs.

* Clear error highlight states, accessible contrast, and mobile-friendly/responsive layout.

* All instructions, errors, and logs written in plain English—minimize technical jargon.

---

## Narrative

Ray is a technically savvy student, but the current Shollu attendance script he runs for class is a headache. Every other week, something breaks—a site update, a silent error, or inconsistent timeouts. The code is tangled and opaque, and even with his skills, troubleshooting means digging through brittle legacy scripts every time. Fellow classmates hesitate to improve the script since it’s hard to even know where to start.

With the migration to Next.js and Node.js/Express, Ray’s workflow changes dramatically. There’s now a clear division: a dashboard UI he can easily navigate and tweak, and a stable backend bot that runs encapsulated logic. Getting up and running locally is fast: git clone, config, start, and he’s in business. If something goes wrong, he sees clear error logs right in the dashboard—no more cryptic stack traces or guessing at what failed overnight.

Ray isn’t just confident in automation—the migration means he’s ready to contribute fixes himself, and friends can finally jump in without losing a weekend wrapping their heads around ancient spaghetti code. The class’s attendance tracking becomes a solved problem, and the project itself grows with community input, lowering the barrier for new contributors and operators alike.

---

## Success Metrics

### User-Centric Metrics

* Time required for a first-time user to set up and automate a successful run (target: under 30 minutes).

* Number of user-reported bugs or support requests per month (target: reduced by 80% post-migration).

* Frequency of dashboard/manual-trigger usage as measured by local app logs.

### Business Metrics

* GitHub stars, forks, and clones (proxy for open-source adoption and reach).

* Number of unique contributors within 3 months of open-sourcing the new version.

* Documentation satisfaction (via GitHub feedback or direct surveys).

### Technical Metrics

* Bot uptime percentage during test cycles (target: 99%+ during scheduled periods).

* Error rates and frequency of crashes or unhandled exceptions (target: <1/week in normal use).

* Consistency of code passing linter/tests post-refactor.

### Tracking Plan

* Key user events:

  * Bot start, stop, and crash events

  * Manual attendance trigger usage

  * Error log accesses

  * Local dashboard loads

* GitHub Issues/comments and feedback on documentation clarity

---

## Technical Considerations

### Technical Needs

* Modular architecture: clear separation between frontend UI (Next.js) and backend bot processes (Node.js/Express).

* Well-defined REST endpoints connecting the dashboard to bot management (status, logs, manual run).

* Minimal local dependencies; avoid overcomplicating with unnecessary libraries.

* Unified configuration management, ideally via `.env` or `config.json`.

### Integration Points

* No external partners or complex integrations—only those required to interact with the Shollu attendance system and local host.

* Possibility to expand for alternative attendance sites in the future.

### Data Storage & Privacy

* All sensitive configuration stored locally—never transmitted over networks.

* Logs and credentials never exposed publicly; documentation prompts users to safeguard teacher account credentials.

* No external/third-party storage or cloud sync.

### Scalability & Performance

* Designed for low user count (single-operator or small group, local use).

* Dashboard and bot processes optimized for fast feedback and local resource footprint.

### Potential Challenges

* Ensuring clean error handling and user-friendly feedback given possible API/site changes.

* Supporting multiple OS environments and handling node/npm version differences.

* Maintaining clear documentation for both operators and contributors to minimize onboarding friction.

* Prompting users to take adequate security precautions with their teacher credentials.

---

## Milestones & Sequencing

### Project Estimate

* Small: 1–2 weeks (focused effort, migration only, foundational dashboard and backend parity).

### Team Size & Composition

* Small Team: 1–2 people covering product, engineering, design, and documentation.

  * One full-stack engineer with strong Node/Next experience can handle the bulk.

### Suggested Phases

**1. Initial Migration & Parity (3–4 days)**

* Key Deliverables: Modular Node.js backend replicating current bot functionality, basic process control, clear config structure. (Lead Engineer)

* Dependencies: Access to existing bot scripts and example teacher account for local testing.

**2. Basic Dashboard Integration (2–3 days)**

* Key Deliverables: Next.js frontend with dashboard homepage, manual trigger button, status/log display fed via backend API. (Lead Engineer/front-end dev)

* Dependencies: Completed backend endpoints, UI design outline.

**3. Open-Source Packaging & Documentation (2–3 days)**

* Key Deliverables: Clean `README.md`, contributor guide, sample configs, error/how-to guides, basic local test script. (Engineer/technical writer)

* Dependencies: Completed migration and working UI, verified on at least two local machines.

* Each phase can be run sequentially by a single engineer or pair, building on the prior deliverables.

* Intended for a lean startup approach—no overprovisioning or unnecessary team overhead.

---