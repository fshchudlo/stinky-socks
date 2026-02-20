# agents.md

## Repository Overview
- Monorepo name: `stinky-socks`
- Purpose: import DevEx pull-request metrics from GitHub and GitLab into PostgreSQL, then visualize/observe via Grafana + Prometheus/Loki stack.
- Language/runtime: TypeScript on Node.js (CI uses Node 22).
- Workspace layout:
  - `packages/importer`: core ingestion pipeline and metrics exporter.
  - `packages/frontend`: small Express app with GitHub OAuth session flow.
  - `assets`: docker-compose stack, Grafana provisioning, Prometheus/Loki/Alertmanager configs.
  - `types`: custom ambient typings (`express` request user typing).

## High-Level Architecture
- Import cycle (`packages/importer/src/app.ts`):
  - Initializes TypeORM datasource.
  - Runs import immediately.
  - Re-runs every 60 minutes.
  - Guards against concurrent runs with `isImportRunning`.
  - On unhandled errors, logs and exits after 60s (container restart strategy).
- Data sources:
  - GitHub public repos via personal tokens.
  - GitHub org/private repos via GitHub App installations.
  - GitLab namespaces/projects via personal access token.
- Storage:
  - PostgreSQL via TypeORM entities and migrations.
  - `migrationsRun: true` enables auto-apply on startup.
- Observability:
  - Importer exposes Prometheus metrics at `:9100/metrics` (`packages/importer/src/metrics.ts`).
  - Prometheus scrapes importer and infra services.
  - Grafana dashboards are provisioned from `assets/grafana-dashboards`.

## Key Packages

### `packages/importer`
- Entry/config:
  - `src/app.ts`: scheduler + process lifecycle.
  - `src/importTeamProjects.ts`: orchestrates GitLab import, GitHub public import, GitHub App installation import.
  - `src/app.config.ts`: environment parsing for DB + GitHub App credentials.
- SCM adapters:
  - GitHub: `src/GitHub/*`
  - GitLab: `src/Gitlab/*`
  - Both adapters:
    - fetch paginated PR/MR data,
    - fetch activities + diff/files,
    - map external payloads into shared DB entities,
    - run integrity validation before save.
- DB layer:
  - `src/MetricsDB/MetricsDB.ts`: TypeORM datasource and helper queries.
  - Entities in `src/MetricsDB/entities`:
    - `PullRequest`
    - `PullRequestParticipant`
    - `PullRequestActivity`
    - `Actor`
- Identity mapping:
  - `ActorFactory` caches/fetches actors per team and auto-generates unique nicknames.
- Rate-limit handling:
  - GitHub personal tokens: `PersonalTokensRotator` rotates based on reset time.
  - GitHub App installation tokens: cached and refreshed with lock-based wait on low remaining quota.

### `packages/frontend`
- Express + Passport GitHub OAuth app.
- Routes:
  - `/auth/github`, `/auth/github/callback`, `/logout`, `/`.
- Uses `express-session`, basic rate limiting, and session enrichment with repo list via GitHub API.
- Config loaded from env in `src/app.config.ts`.

## Data Model and Metric Semantics
- Composite PR identity: `(teamName, projectName, repositoryName, pullRequestNumber)`.
- Core PR fields include:
  - timeline dates (`created`, `updated`, `sharedForReview`, `initialCommit`, `lastCommit`, `merged`)
  - reviewer/request/comment metrics
  - diff size (`diffRowsAdded`, `diffRowsDeleted`)
  - quality flags (`testsWereTouched`, `hasOtherHumanApproval`)
  - `authorRole` and `integrityErrors`.
- Participant model stores first/last timestamps for comment/review/approval and comment count.
- Activity model stores normalized events (`commented`, `reviewed`, `approved`, `changes_requested`, `committed`, `ready_for_review`, `merged`, etc.).
- Integrity checks (`PullRequest.validateDataIntegrity`) detect temporal inconsistencies and anomalous states; invalid rows are still stored but marked.

## Import Logic Details
- GitHub importer (`GitHubPullRequestsImporter`):
  - Iterates selected repos (`repositoriesSelector` optional per team).
  - Pulls closed PRs sorted by `updated` ascending.
  - Skips unmerged PRs.
  - Incremental strategy uses existing PR count and max stored `updatedDate`.
  - Sanitizes mannequin/deleted user logins.
- GitLab importer (`GitlabPullRequestsImporter`):
  - Enumerates namespaces then projects.
  - Pulls merged MRs sorted by `updated_at` ascending.
  - Normalizes user payloads with extra user lookups.
  - Parses review request add/remove events from note text.
- `sharedForReviewDate` heuristic (both SCMs):
  - first `ready_for_review` event if present;
  - else first reviewer-add event if all reviewer adds happened after creation;
  - else PR creation date.

## Configuration Surfaces
- Root scripts (`package.json`):
  - `npm run start|build|test` fan out to workspaces.
  - `docker:init`, `docker:destroy`, `docker-import:start`, `docker-import:stop`.
- Import target config:
  - GitHub public teams/projects: `packages/importer/src/githubPublicProjectsImportConfig.ts`.
  - GitLab endpoint/team resolution: `packages/importer/src/gitlabProjectsImportConfig.ts`.
- Docker env examples:
  - `assets/.env`
  - `packages/importer/.env`

## Local/CI Workflow
- Local setup:
  - `npm ci`
  - `npm run docker:init`
  - configure env values (DB, tokens, optional GitHub App/GitLab)
  - `npm run start` for local importer
- Full containerized import:
  - `npm run docker-import:start`
- Tests:
  - `npm run test`
  - snapshots can be updated with `npm run test:update-snapshots`
- CI (`.github/workflows/ci.yml`):
  - install, lint, build, test on push to `main` and pull requests.

## Observability Stack
- Compose file: `assets/docker-compose.yml`
- Services:
  - `postgres`, `prometheus`, `alertmanager`, `loki`, `alloy`, `grafana`
- Importer compose overlay: `assets/docker-compose.dev.yml`
- Prometheus rules:
  - alert `ImporterHighMemory` when importer RSS exceeds 500MB for 1m.

## Testing State
- There are meaningful unit tests around GitHub/GitLab mapping logic and helper parsing.
- Integration-style API tests exist but are mostly skipped and depend on real tokens/API access.
- No strong end-to-end test harness for full pipeline + DB + dashboards.

## Security and Operational Notes
- Sensitive values are present in local env files (`assets/.env`, `packages/importer/.env`) in this workspace.
- Keep these files untracked and avoid copying real secrets into any tracked examples; use a secret manager for shared environments.
- Importer is network/API heavy and relies on retry + rate-limit waits; long-running imports are expected.
- Data quality depends on SCM event consistency; integrity warnings are expected for edge cases.

## Conventions and Tooling
- TypeScript strict mode enabled in root `tsconfig.json`.
- TypeORM uses snake_case naming strategy.
- ESLint uses `typescript-eslint` recommended config; `no-explicit-any` is disabled.
- Jest config at repo root uses `ts-jest` and Node environment.
- Formatting configured via `.prettierrc` (4 spaces, print width 140).

## Database Structure Management
- Source of truth for DB schema is TypeORM entities in `packages/importer/src/MetricsDB/entities`.
- Do not hand-write migration SQL when normal schema diffs are needed; generate migrations with TypeORM.
- Migration generation command (from repo root):
  - `npm run migration:generate --workspace=packages/importer ./src/MetricsDB/migrations/<MIGRATION_NAME>`
- Migration execution commands:
  - `npm run migration:run --workspace=packages/importer`
  - `npm run migration:revert --workspace=packages/importer`
- Prerequisite: PostgreSQL from local stack must be running and reachable with env from `packages/importer/.env` (see README `Managing database structure` and local setup).
- Migrations auto-run on importer start because datasource sets `migrationsRun: true`.

## Suggested Areas for Future Agents
- Add pre-commit/CI secret-scanning to prevent accidental secret commits.
- Add deterministic integration tests using mocked SCM APIs and a disposable Postgres.
- Add indexes for frequent PR lookup filters if dataset grows large.
- Consider resilience improvements for partial import failures (checkpointing per repo/page).
