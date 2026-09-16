# Data Safety Rule

**CRITICAL RULE: DO NOT DELETE OR RESET DATA**
The data stored in this database is extremely valuable to the user.
- NEVER use destructive Prisma commands such as `prisma db push --force-reset` or `prisma migrate reset`.
- ALWAYS use non-destructive Prisma commands such as `prisma db push --accept-data-loss` ONLY if explicitly cleared with the user that specific columns can be dropped, but NEVER drop entire tables unless explicitly asked.
- When performing database updates or schema changes, double check that existing data will be preserved.
- When adding placeholder or seed data, do not overwrite existing tables or rows.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
