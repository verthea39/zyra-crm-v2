# Data Safety Rule

**CRITICAL RULE: DO NOT DELETE OR RESET DATA**
The data stored in this database is extremely valuable to the user.
- NEVER use destructive Prisma commands such as `prisma db push --force-reset` or `prisma migrate reset`.
- ALWAYS use non-destructive Prisma commands such as `prisma db push --accept-data-loss` ONLY if explicitly cleared with the user that specific columns can be dropped, but NEVER drop entire tables unless explicitly asked.
- When performing database updates or schema changes, double check that existing data will be preserved.
- When adding placeholder or seed data, do not overwrite existing tables or rows.
