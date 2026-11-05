---
name: review-copy
description: Review the text in the code — identifier naming, comments, test descriptions, UI copy and metadata, and the docs — for spelling, grammar, consistency and the project's conventions, and report findings to accept. Use when asked to review naming, comments, wording or copy in a file, a diff or the whole project.
---

Talk to the user in the language they write in. Report findings and propose exact replacements; apply only the ones the user accepts.

## Scope

Work on what the user names: a path, the current diff (`git diff main...HEAD` plus uncommitted changes), or the whole project. For the whole project, cover `src/`, the configuration files at the root, `.github/`, `.claude/`, `.husky/`, `docs/`, `AGENTS.md` and `README.md`, and skip generated or vendored code (`.next`, `node_modules`, `pnpm-lock.yaml`, generated migrations). Components copied from a registry (`src/app/components/ui/shadcn/` and any other registry folder under `ui/`) are only checked for copy we added, not for their upstream naming. Read the files before reporting.

The Language section in `AGENTS.md` says which texts are in English and which, if any, are in another language. Check each text in its own language.

## Check

1. **Spelling**: typos in identifiers, comments, strings and docs, in every language the project uses, including diacritics (e.g. `não`, never `nao`, in pt-BR).
2. **Naming**:
   - Correct English, including each word of a compound identifier and its grammatical number (`getVisiblePosts` returns a list).
   - The name says what the thing is or does, at the level of the caller: no vague names (`data`, `handle`, `info`, `temp`) where a specific one fits, and no names that lie about the type or the behavior.
   - Consistent patterns across the codebase: `get*` for lookups, `is*`/`has*` for booleans, `use*` only for hooks, components in PascalCase, files in kebab-case, `actions.ts` only for files with `'use server'` (see Project structure in `AGENTS.md`).
   - The same concept has the same name everywhere (e.g. `user` vs `account`, `slug` vs `id`), in code, tests and docs.
3. **Comments**: grammar, and the project rule from `AGENTS.md`: a comment only records why a decision was made, ideally with a reference; flag comments that explain what the code does or how it works, and comments that are stale (the reason no longer applies or the reference is gone).
4. **Test descriptions**: grammar, and whether each `describe`/`it`/`test` reads as a sentence that states the expected behavior (`test('hides drafts outside development')`), consistent in tense and person within a file.
5. **UI copy and metadata**: grammar, a consistent tone across pages, the same term for the same thing everywhere, error messages that say what happened and what to do next, accessible names (`aria-label`, alt text) that describe the purpose, and titles and descriptions in metadata.
6. **Docs** (`AGENTS.md`, `README.md`, `docs/`, issue templates): grammar, consistency with the code (paths, script names and file names that still exist), consistency between `AGENTS.md` and `README.md`, and the Documentation Rules in `AGENTS.md`.

## Report

Group findings by severity, most severe first:

- **Error**: typos, grammar mistakes, names or comments that are wrong or misleading, docs that contradict the code.
- **Improvement**: unclear or inconsistent naming, comments that break the project rule, test descriptions that don't state the behavior.
- **Suggestion**: optional wording.

For each finding: `path:line`, the current text, the proposed text and a one-line reason. Mark renames of exported symbols or files, since they touch other files; list where they're used. Skip categories with no findings.

Then ask which findings to apply. Apply renames across every usage (code, tests, docs), then run `pnpm type-check`, `pnpm eslint:check`, `pnpm prettier:check` and `pnpm test`.
