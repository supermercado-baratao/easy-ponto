<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Conventions

### Scope

This is **Easy Ponto**, the timekeeping system of Supermercado Baratão. It reads the company, the employees and the punch records from the time clock (a Control iD iDClass, called the device in the code, through its HTTPS API). The store uses Secullum today, so importing its **Cartão Ponto** report (`.xls`, `.xlsx` or `.csv`) is a migration aid, not part of the regular flow: it brings over what the device doesn't have (department, position, admission date, payroll number, schedule) and the punches added by hand in Secullum. The stack: Postgres through **Prisma Next** (`@prisma/orm-postgres`, a release candidate), Server Components and Server Actions (there is no public API), and **shadcn/ui** on Base UI for the interface.

There is no login yet: the `ADMIN_USER_ID` environment variable picks the `AdminUser` the private pages load. Server code reads it through `getAdminUser` (`src/entry/admin-user.ts`). Server Actions take the admin user, the company and the device credentials from there, never from the client, and the device password is never passed to a client component (#54). Login and roles come later; don't treat the missing authentication as a bug in unrelated work.

### Language

- **Portuguese (pt-BR):** GitHub issues (titles and bodies), the issue template, `README.md` and everything users see: UI copy, metadata, toasts and the `message`/`action` of the errors.
- **English:** code (identifiers and comments), test descriptions, commit messages, branch names, pull requests (title and body), `AGENTS.md`, `docs/` and the AI workflow under `.claude/`. Route segments are the exception: they are part of the UI, so they are in Portuguese (`/configuracoes`, `/registros-de-ponto`).

### Package manager

- Use **pnpm** only (not npm/yarn).
- Versions are pinned exact (no `^`/`~`) for `dependencies` and `devDependencies` in `package.json`. Install new deps with `pnpm add -E <pkg>` (or `pnpm add -D -E <pkg>`) — never hand-edit version strings.
- `-E` only takes effect when no version is given. `pnpm add -E <pkg>@<version>` (or `@latest`) and packages already in `package.json` still get a `^`. In those cases, remove the carets right after (`sed -i -E 's/"\^([0-9])/"\1/' package.json`) and run `pnpm install`.
- The exact-version rule does not apply to MCP servers (`.mcp.json`) or `package.json` scripts, which may use `@latest` (e.g. `pnpm dlx shadcn@latest`, `pnpm dlx @playwright/mcp@latest`). They must still run through pnpm, never `npx`.
- `minimumReleaseAge` in `pnpm-workspace.yaml` (7 days, in minutes) keeps pnpm from resolving a version published less than a week ago. `prisma` and `@prisma/*` are excluded, since the project follows the Prisma Next release candidates.
- Node version is pinned in `.nvmrc` (`lts/krypton`) and in `engines.node` (`24.x`). Keep both on the same major.
- `xlsx` comes from the SheetJS CDN (`https://cdn.sheetjs.com/...`), since the npm package is no longer updated.
- `@/*` resolves to `src/*` (`tsconfig.json`).

### Project structure

- `src/app` holds frontend-exclusive content only. Server code (the layers below) and `src/tests` live directly under `src`, as siblings of `app`.
- Routes are grouped under `src/app/(pages)`, with nested groups by audience: `(public)` (landing page and `/status`) and `(private)` (the pages that load the `AdminUser`, inside the sidebar layout). Shared client hooks live in `src/app/hooks` (`use-<name>.ts`).
- `src/app/components` groups components by role: `ui/` for visual building blocks (shadcn ones under `ui/shadcn/`, other registries under their own folder, e.g. `ui/magic-ui/`, `ui/shadcn-io/`, and our own under `ui/custom/` and `ui/icons/`), `blocks/` for composed pieces reused across pages (e.g. `blocks/app-sidebar/`) and `providers/` for context providers without UI of their own.
- Server code is layered, and imports only flow down: `app` → `entry` → `models` → `repositories` → `infra`, with `constants` as a leaf every layer may import (it imports none of them). `no-restricted-imports` in `eslint.config.mjs` enforces the direction per folder, and, among `app`, `entry` and `models`, none may import the database client (`src/infra/database/client.ts`): queries go through `repositories`.
  - `src/entry/` adapts Server Actions to the models (`handleFormAction`).
  - `src/models/<domain>/` holds the business rules of one domain: `model.ts` (exports `<domain>Model`), and, when needed, `schema.ts` (Zod schemas), `types.ts`, `errors.ts` and `utils.ts`. A domain with several internal helpers keeps them in `_utils/` (e.g. `src/models/synchronization/_utils/afd.ts`). `src/models/device/` talks to the time clock (`device-api.ts` creates the Axios instance).
  - `src/repositories/<domain>-repository.ts` exports `<domain>Repository` with the queries of one domain.
  - `src/infra/` holds the technical base: the database (`database/`), `dayjs`, the errors and the local services and scripts. `src/constants/` holds values shared across layers (e.g. the document lengths).
- Type aliases start with `T` (`TDeviceUser`, `TCompanyState`). The row types come from the contract in `src/infra/database/types.ts` (`User`, `Company`, ...), with `TInputData<T>` for a row without `id`/`createdAt`/`updatedAt`.
- There are no `index.ts` barrels: import each module directly from its file.
- Everything lives as close as possible to where it is used. A component's Server Action, types and children sit in its folder inside the route's `_components/` (e.g. `_components/company-form/actions.ts`). Never import a page's `_components/` from another route tree.
- `actions.ts` with `'use server'` is only for mutations called from the client. A function a Server Component calls to read data is not a Server Action: name its file `data.ts` (e.g. `src/app/(pages)/(private)/configuracoes/data.ts`).
- A page that reads the database renders on each request: the public pages' `data.ts` call `connection()` from `next/server`, and the private pages export `dynamic = 'force-dynamic'` until authentication makes them dynamic on their own. Otherwise `next build` prerenders the data of the build.
- React Compiler is enabled (`reactCompiler: true` in `next.config.ts`).

### Database & local services

- `src/infra/compose.yml` declares two Postgres services: `database` (port `5432`, persistent volume, `.env.development`) and `database-test` (port `5433`, `tmpfs`, `.env.test`), so the tests never touch the development data.
- `pnpm dev` chains `services:up` → `services:wait:database` → `migrations:up` → `next dev`. The containers keep running after `next dev` stops: use `pnpm services:stop` or `pnpm services:down`.
- `.env.development` and `.env.test` are committed and hold only local values. The git-ignored `.env.local` holds the `ADMIN_USER_ID` (see the `README.md`) and the credentials of the real device (`DEVICE_IP`, `DEVICE_LOGIN`, `DEVICE_PASSWORD`, `DEVICE_SESSION_TOKEN`), used by the external tests and by `pnpm test:mocks:create`. Never put them in a committed file.
- The schema is the Prisma contract in `src/infra/database/contract.prisma`. `contract.json` and `contract.d.ts` are generated from it (`pnpm database:generate`, also run on `postinstall`) and git-ignored.
- `pnpm migrations:generate <name>` emits the contract and plans a migration into `src/infra/database/migrations/app/`; `pnpm migrations:up` applies the pending ones. Generated migrations and snapshots are not linted or hand-edited.
- `src/infra/database/client.ts` creates one client per process (kept on `globalThis` outside production, so hot reload doesn't open new pools). Repositories use `database.orm.public.<Model>`, `database.raw.sql` for raw queries and `database.transaction(async (tx) => ...)` for writes that must succeed or fail together.
- `punch_records.pis` references `users.pis`, and the PIS is stored with 12 digits, the size the AFD reserves for it (`PIS_LENGTH`).

### Time clock & synchronization

- The device answers over HTTPS with a self-signed certificate and non-standard HTTP, so `createDeviceApiInstance` turns off `rejectUnauthorized` and enables `insecureHTTPParser`. Requests send `mode=671` (the AFD of Portaria 671).
- `getSession` reuses the session token saved in `devices_sessions` while the device accepts it, and logs in again otherwise. `deviceModel.loadUsers` reads the users in pages of 100.
- `synchronizationModel` (`src/models/synchronization/model.ts`) holds the flows: `synchronizeCompany`, `synchronizeUsers` (creates the new device users and updates the saved ones by PIS), `synchronizeAfd` (parses the AFD and saves the records, skipping the NSRs already saved) and `importFile` (reads the Secullum report for the migration, updates the users by name and the company registration, creates the punches marked with `*`, which are not in the AFD, and saves the "Horário de Trabalho" block as each user's schedule). The imported schedule starts on the first day of the report's period: Secullum prints the current schedule, not the one in effect during the period, so no date in the report says when it began.
- The AFD records of a PIS that no saved user has are dropped on purpose, until #30 decides how to keep the history of former employees.
- Dates and times are stored as UTC wall-clock values: `@/infra/dayjs` exports `dayjs.utc`, so a punch at `07:27` is saved as `07:27Z`. Always build dates through it, and take the current date from `wallClockNow()` (the store's local time in São Paulo), never from `dayjs()`.

### Forms

- Forms are client components that call `useFormState` (new forms use `useActionState`, its current name in React 19) with a Server Action from their `actions.ts`, and render `FormCard`, `FormField` and `Select` from `src/app/components/ui/custom/form.tsx`, with `Loader` in the submit button while the action is pending.
- A form submit wraps the model call in `handleFormAction(model.method, state, formData)` (`src/entry/form-action.ts`), which turns the `FormData` into an object, returns `data` and `success` and maps the errors: a `ZodError` becomes `errors` (the first message per field, in Portuguese through `z.config(pt())`) and anything else becomes `fatalError`, which the form shows as a toast (`sonner`). Actions that are not a form submit (e.g. `importFromDevice`, `importFile`) catch the error themselves and return `fatalError`.
- Each model validates its own input with its `schema.ts` (`schema.parse(input)`), never in the action. Always persist the data Zod validated, never the raw input.
- Whatever can be created can also be edited, and every field of a form is editable. The only exception is immutable data, such as the `id`, the timestamps and the fields read from the AFD (`nsr`, `afdDatetime`, ...).

### Linting & formatting

- ESLint uses native flat config (`eslint.config.mjs`), extending the `core-web-vitals`/`typescript` configs from `eslint-config-next`, plus `eslint-plugin-unicorn`, `eslint-plugin-simple-import-sort`, `eslint-plugin-tailwindcss`, `eslint-plugin-promise`, `eslint-plugin-prefer-arrow-functions`, `eslint-config-prettier`, and `@eslint/json`/`@eslint/markdown` for JSON/Markdown files. `eslint-plugin-tailwindcss` reads the theme from `src/app/styles/globals.css`, and its rule docs are in `node_modules/eslint-plugin-tailwindcss/docs/rules/`; classes defined in plain CSS go in the `whitelist` of `tailwindcss/no-custom-classname`.
- `@typescript-eslint/explicit-function-return-type` applies to `src/**/*.ts`, except the tests, the hooks, Route Handlers and the database client.
- `unicorn/no-top-level-assignment-in-function` is off in `src/tests/**`, since tests share state set in `beforeAll` or in an earlier test through top-level `let`.
- The `pnpm peers check` warnings about ESLint 10 come from the plugins of `eslint-config-next`; `pnpm eslint:check` passes.
- `next lint` no longer exists (removed in Next.js 16). Use `pnpm eslint:check` / `pnpm eslint:fix` and `pnpm prettier:check` / `pnpm prettier:fix`.
- `pnpm type-check` runs `next typegen` first, so a clean checkout has the generated route types.
- The `review-copy` skill (`.claude/skills/review-copy/`) reviews the text in the code (naming, comments, test descriptions, UI copy, docs); use it on a diff before opening a pull request.
- Prettier style: single quotes, no semicolons, no trailing commas (`.prettierrc`). Base whitespace rules are in `.editorconfig`.

### Code comments

- Comments only record **why** a decision was made, ideally with a reference (docs link, issue number, upstream bug). Never write comments that explain what the code does or how it works.
- Default to no comment. Add one only for a non-obvious choice that someone might "fix" by mistake.
- Write comments in English.

### Git hooks (husky)

- `pre-commit`: runs `lint-staged` (`lint-staged.config.js`), which runs ESLint, Prettier and `vitest related --project unit --passWithNoTests` on the staged files, by type. Only the unit tests run there, so a commit never needs the services.
- `commit-msg`: auto-prepends the emoji prefix from the Commit Rules below based on the leading word (e.g. `feat: ...` → `✨ feat: ...`), then runs `commitlint` (`commitlint-config-emoji-convention`). Type the plain word and let the hook add the emoji.
- `pre-push`: runs `pnpm type-check`, `pnpm test:integration` and `pnpm test:e2e`.
- The `commit-msg` hook's `sed` matches `fixup!` as `fix` and produces an invalid type, so `git commit --fixup`/`--autosquash` don't work. To fix the commit you just made in the same task, use `--amend`.

### Testing

- Unit tests: **Vitest** (`vitest.config.mts`, project `unit`), `jsdom` environment. They pick up `src/**/*.test.{ts,tsx}` outside `src/tests`, next to the code they test (e.g. `src/models/synchronization/_utils/afd.test.ts`). A test that needs Node APIs (e.g. `File` with `xlsx`) starts with `// @vitest-environment node`. Test files import `describe`/`test`/`expect`/`vi` from `vitest` (no globals).
- Integration tests: project `integration`, in `src/tests/integration/`. They call the models directly against `database-test`: `pnpm test:integration` starts the services and runs the migrations on it first. `src/tests/setup.ts` loads `.env.test` before anything else, and `orchestrator.clearDatabase()` refuses to truncate a database whose name doesn't end in `_test`. The files run one at a time, since they share the database.
- External tests: project `external`, in `src/tests/external/`. They use the real device with the credentials of `.env.local`. They never run in CI or in the hooks, and `pnpm test:external` is run only when nothing else can check the change.
- E2E tests: **Playwright** (`playwright.config.ts`), in `src/tests/e2e`, single `chromium` project. The config loads `.env.test`, and the `webServer` runs `pnpm test:services` and then `next dev` on port `3001` with `NEXT_DIST_DIR=.next/e2e` (read by `distDir` in `next.config.ts`), so it uses `database-test` and runs next to a `pnpm dev` already open (`next dev` locks its output folder). Outside CI it reuses a server already on port `3001`. Next adds the `.next/e2e` type globs to the `include` of `tsconfig.json`, so keep those entries committed. Assertions wait up to 15s (`expect.timeout`), since `next dev` compiles each route on its first request.
- `src/tests/e2e/global-setup.ts` clears `database-test` and populates it with the mocked data before the E2E tests. The server reads `ADMIN_USER_ID` from `.env.test` when it starts, before the setup runs, so the E2E admin user is created with that fixed id. The integration and E2E tests share `database-test`: never run them at the same time.
- `src/tests/_mocks/` holds fake device data (`afd.txt`, `device-users.ts`, `parsed-afd.ts`), generated from the real device by `pnpm test:mocks:create`, which replaces every PIS and name with Faker values. Real employee data (names, PIS, CPF) never goes into the repository, an issue or a pull request.
- `src/tests/orchestrator.ts` centralizes the setup: `waitForAllServices`, `clearDatabase`, `populateDatabaseWithMockedData` and `populateDatabaseWithRealData` (external tests only). `src/tests/_utils/` holds helpers used only by tests.
- Only test logic we wrote (the models' rules, the AFD and spreadsheet parsing, mappings, the queries). Don't test library or framework behavior. Older issues may ask for tests that break this rule: skip them and list them as dropped in the closing comment.
- Assertions check real behavior, not the incidental state of the fixture.
- CI (`.github/workflows/ci.yml`, on `pull_request`) runs, in order: `commitlint` over the PR's commit range, `pnpm type-check`, `pnpm eslint:check`, `pnpm prettier:check`, `pnpm test`, `pnpm test:integration`, then installs Chromium and runs `pnpm test:e2e`.

### Styling & UI

- Tailwind CSS v4 (`@tailwindcss/postcss`). Global styles live in `src/app/styles/globals.css`, which imports `tw-animate-css` and the shadcn base stylesheet (`shadcn/tailwind.css`). The fonts are Geist and Geist Mono (`next/font/google`).
- Dark mode uses `next-themes` with the `class` attribute (`@custom-variant dark (&:is(.dark *))`), following the system by default, with the toggle in the header (`blocks/toggle-theme.tsx`).
- Don't retint the default colors: keep the shadcn tokens in `globals.css` (`neutral` base color) and Tailwind's palette as they come, and prefer the shadcn tokens (`bg-background`, `text-muted-foreground`, ...) for surfaces and text.
- **shadcn/ui** (`components.json`, style `base-nova`, base color `neutral`, icon library `lucide`) is the component library: reach for a shadcn component before writing one from scratch. Add components with `pnpm shadcn:add <name>`. Components from other registries (e.g. `@magicui`, declared in `components.json`) go under their own folder in `ui/`. If the CLI installs a dependency with a `^`, remove the caret (see Package manager).
- Links that need to look like a `Button` stay plain `<a>`/`Link` elements styled with `buttonVariants(...)`. The sidebar items render a `Link` through the `render` prop of `SidebarMenuButton`, and a `Button` rendered as another element (e.g. `render={<span />}` inside a `<label>`) takes `nativeButton={false}`.
- Supporting libs: `@base-ui/react` (headless primitives), `class-variance-authority`, `cn` (imported directly from the `cn` package, with no `lib/utils.ts` re-export), `lucide-react` for icons and `sonner` for toasts. Before wiring up a Base UI primitive, check its docs in `node_modules/@base-ui/react/docs/react/`.

## Development Workflow

The end-to-end flow (planning, issues, branches, commits, pull requests and closing) is described in [`docs/development-workflow.md`](./docs/development-workflow.md). Follow it for any issue.

## Branch Rules

Work for an issue is committed on a new branch, never directly on `main`. Branch names follow `<scope>/<title>#<issue>`, or `<scope>(<target>)/<title>#<issue>` when the work is very specific:

- `<scope>` is one of the semantic prefixes from the Commit Rules below, without the emoji (`feat`, `fix`, `docs`, `chore`, ...).
- `(<target>)` is optional: the page, component or other specific area the work touches (e.g. `settings`).
- `<title>` is a short, lowercase, hyphen-separated summary in English.
- `#<issue>` is the number of the associated issue.

Examples: `feat/punch-records-page#12`, `fix(settings)/company-state#11`. Parentheses and `#` are special characters in shells, so quote the branch name in commands (e.g. `git switch -c 'fix(settings)/company-state#11'`).

## Issue Rules

Before closing an issue, tick every completed checklist item (`- [x]`) in its body, e.g. with `gh issue edit <number> --body-file <file>`. Don't close an issue that still has unchecked items unless they were dropped or moved, and say so in the closing comment.

## Documentation Rules

`AGENTS.md` and `README.md` record only project conventions: what to do, where things live and how to handle a given case. Answers to the user's one-off questions stay in the conversation and are not written into them. Keep a "why" only when it prevents a likely mistaken "fix". If a change touches a convention, update both files in the same branch.

## Task Rules

Never start working on a task on your own, even when asked to move on to the next one or in auto/agentic mode. First present a summary of the plan (the issue, branch name, steps, files touched and any open decisions) and wait for explicit approval before creating the branch, installing dependencies or editing code. Read-only investigation (issues, docs, code) needs no approval.

## Commit Rules

Never run `git commit` on your own, even in auto/agentic mode. Only propose a commit message when the user asks for one, and create the commit only after explicit approval of that message.

Commit messages must be in English and follow this format:

- Use the following semantic prefixes: `🎉 init, ✨ feat, 🐛 fix, 📚 docs, 💎 style, 📦 refactor, 🚀 perf, 🚨 test, 🛠 build, ⚙️ ci, ♻️ chore, 🗑 revert`
- The message must be in the imperative mood and in lowercase.
- Write the commit body.
- Reference an associated issue by number, if it exists, using the format `Issue: #<number>`.

Example:

```text
✨ feat: add punch records page

List the punch records of the selected employee with the following features:
- Filter by period
- Show the records added by hand

Issue: #12
```
