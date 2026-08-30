---
name: Drizzle migration output
description: Drizzle Kit path behavior when generating and checking migrations in this pnpm workspace.
---

Drizzle Kit expects the migration `out` directory to be a package-relative path such as `./drizzle`; an absolute path built from `__dirname` can make `drizzle-kit check` resolve metadata as a duplicated absolute path.

**Why:** The migration generated successfully with the absolute-looking configuration, but the subsequent consistency check could not locate its snapshot until the output was made relative.

**How to apply:** Keep `out` relative to `lib/db` in `lib/db/drizzle.config.ts`, and run `generate` followed by `check` after schema or config changes.