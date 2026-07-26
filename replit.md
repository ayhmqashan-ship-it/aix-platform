# AIX — Artificial Intelligence eXperience

نظام ذكاء شخصي يساعد الطالب على اتخاذ القرار الصحيح في الوقت الصحيح — "ماذا أدرس الآن؟"

## Run & Operate

- `pnpm --filter @workspace/aix-app run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + wouter (Arabic RTL, IBM Plex Sans Arabic)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle table definitions (users, subjects, lessons, schedule, exams, studySessions)
- `artifacts/api-server/src/routes/` — Express route handlers (user, subjects, lessons, schedule, exams, achievements, decision, dashboard)
- `artifacts/api-server/src/lib/decisionEngine.ts` — local smart decision algorithm (no external AI)
- `artifacts/aix-app/src/` — React frontend (Arabic RTL)

## Architecture decisions

- **Single user MVP**: all data is scoped to userId=1; multi-user support can be added later by injecting user from session
- **Decision Engine is local**: pure TypeScript scoring algorithm in `decisionEngine.ts`; scores by exam proximity, difficulty, mastery, completion status, and review staleness
- **Modular routes**: each domain (subjects, lessons, schedule, exams, achievements, decision, dashboard) is an independent Express router — adding new modules requires only adding a new file and registering it in `routes/index.ts`
- **OpenAPI-first**: all types generated from spec — never hand-write types that codegen produces

## Product

AIX v1.0.0 MVP:
- شاشة تسجيل متعددة الخطوات
- لوحة رئيسية مع ملخص ذكي
- إدارة المواد والدروس مع تتبع مستوى الإتقان
- جدول الحصص الأسبوعي
- جدول الاختبارات
- شاشة الإنجازات والشارات
- محرك القرار الذكي "ماذا أدرس الآن؟"
- صفحة عن AIX

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change in `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking artifact packages
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`
- `date(..., { mode: "string" })` used for `examDate` — keep as YYYY-MM-DD string, do not convert to Date object

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
