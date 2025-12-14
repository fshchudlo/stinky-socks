# AI Coding Guidelines for stinky-socks

## Architecture Overview
This is a TypeScript monorepo for importing DevEx metrics from GitHub and GitLab pull requests into a PostgreSQL database, visualized via Grafana.

- **Packages**: `importer` (data ingestion), `frontend` (Express web app with GitHub OAuth), shared `types`.
- **Data Flow**: Importers fetch PR data via APIs, transform using entity helpers, store in TypeORM entities (snake_case naming).
- **Key Entities**: `PullRequest`, `PullRequestParticipant`, `Actor`, `PullRequestActivity` in `packages/importer/src/MetricsDB/entities/`.
- **APIs**: GitHub/GitLab APIs with token rotation; frontend uses Passport for auth.

## Developer Workflows
- **Setup**: `npm i` at root, `npm run docker:init` for Postgres/Grafana, create `.env` in `packages/importer/` from `assets/docker-compose.dev.yml`.
- **Import Data**: `npm run start` (runs importer), `npm run docker-import:start` (full stack with logs).
- **Build/Test**: `npm run build/test` across workspaces; update snapshots with `npm run test:update-snapshots`.
- **DB Migrations**: `npm run migration:generate <name>` in importer package; auto-run on start.
- **Debug**: Use `console.time/timeEnd` for timings, `console.group/groupEnd` for logs; check `validateDataIntegrity` in `PullRequest.ts` for data issues.

## Code Conventions
- **Structure**: Entities in `entities/`, helpers in `entities/helpers/`, API logic in `api/`.
- **Patterns**: Use `ActivityTraits` filters for PR activities (e.g., `ActivityTraits.isReadyForReviewEvent`).
- **Calculations**: Pure functions for metrics like `calculatePrSharedForReviewDate` in helpers.
- **Error Handling**: Log errors, exit with delay for API issues; rate limiting in frontend.
- **Imports**: Relative paths within packages; TypeORM decorators for entities.

## Examples
- Import PRs: Instantiate `GitHubPullRequestsImporter` with API and settings, call `importPullRequests()`.
- Query DB: Use `MetricsDB.getRepository(PullRequest).createQueryBuilder()` for custom queries.
- Auth: Frontend routes use `passport.authenticate('github')` with scopes.

Reference: [README.md](README.md) for setup; [PullRequest.ts](packages/importer/src/MetricsDB/entities/PullRequest.ts) for data model.</content>
<parameter name="filePath">/Users/fshchudlo/Github/stinky-socks/.github/copilot-instructions.md