# AIX — Artificial Intelligence eXperience

نظام ذكاء شخصي يساعد الطالب على اتخاذ القرار الصحيح في الوقت الصحيح:
**ماذا أدرس الآن؟**

هذه هي النسخة المرجعية **AIX v1.0.1 Hardening**. المشروع لا يعيد بناء قوائم
مهام تقليدية؛ بل يجمع معلومات الدراسة ويقترح الأولوية التالية من خلال محرك
قرار محلي قابل للتفسير.

## Vision

بناء نظام ذكاء شخصي يساعد الإنسان على اتخاذ القرار الصحيح في الوقت الصحيح،
ضمن تجربة عربية RTL هادئة وقابلة للتوسع.

## What AIX includes

- ملف طالب متعدد الخطوات باللغة العربية
- Dashboard مع التقدم والاختبارات والقرار الذكي
- إدارة المواد والدروس ومستوى الإتقان
- جدول أسبوعي وجدول الاختبارات
- الإنجازات والشارات
- Decision Engine محلي بدون خدمة AI خارجية
- PostgreSQL + Drizzle ORM
- OpenAPI-first API مع Zod وReact Query client مولدين

## Architecture

```text
User
  ↓
React + Vite
  ↓
Generated API Client
  ↓
Express API
  ↓
Route Modules + Decision Engine
  ↓
Drizzle ORM
  ↓
PostgreSQL
```

للتفاصيل، راجع [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech Stack

- Node.js 24
- pnpm workspaces
- TypeScript 5.9
- React + Vite + Tailwind CSS v4
- Express 5
- PostgreSQL + Drizzle ORM
- Zod (`zod/v4`) و`drizzle-zod`
- Orval لتوليد API client وZod schemas من OpenAPI
- IBM Plex Sans Arabic وRTL

## Project Structure

```text
artifacts/
  aix-app/                 React web application
  api-server/              Express API server
  mockup-sandbox/          Isolated component preview server
lib/
  api-spec/                OpenAPI source of truth + Orval config
  api-client-react/        Generated React Query client
  api-zod/                 Generated Zod schemas
  db/                      Drizzle schema, config, and migrations
scripts/                   Workspace helper scripts
docs/                      Architecture and local development guides
```

## Requirements

- Node.js 24 (أو إصدار Node يدعم إعدادات المشروع الحالية)
- pnpm 10+
- PostgreSQL 14+

## Installation

```bash
pnpm install
cp .env.example .env
```

افتح `.env` وضع قيمة `DATABASE_URL` المحلية فقط. الملف `.env` مستثنى من Git
ولا يجب رفعه إلى GitHub.

## Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | نعم | اتصال PostgreSQL |
| `PORT` | لا | منفذ API؛ الافتراضي `8080` |
| `API_PORT` | لا | المنفذ الذي يستخدمه Vite proxy؛ الافتراضي `8080` |
| `BASE_PATH` | لا | مسار نشر الواجهة؛ الافتراضي `/` |
| `NODE_ENV` | لا | بيئة التشغيل |
| `LOG_LEVEL` | لا | مستوى سجلات API؛ الافتراضي `info` |

لا توجد مفاتيح API أو كلمات مرور مطلوبة في المستودع. راجع [.env.example](.env.example).

## Database Setup

أنشئ قاعدة محلية فارغة، ثم شغّل migration الأول:

```bash
createdb aix_dev
set -a
source .env
set +a
pnpm --filter @workspace/db run migrate
```

إذا كانت قاعدة البيانات موجودة مسبقاً وتحتوي على جداول AIX، استخدم `push` فقط
بعد مراجعة التغييرات:

```bash
pnpm --filter @workspace/db run push
```

لا تستخدم بيانات قاعدة Replit أو الإنتاج داخل GitHub. تفاصيل PostgreSQL
والـmigration موجودة في [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Development

شغّل كل خدمة في terminal مستقل بعد تحميل `.env`:

```bash
set -a; source .env; set +a
pnpm --filter @workspace/api-server run dev
```

وفي terminal ثانٍ:

```bash
set -a; source .env; set +a
pnpm --filter @workspace/aix-app run dev
```

- API: `http://localhost:8080/api/healthz`
- Web: `http://localhost:5173/`
- Vite يمرر `/api` إلى API المحلي عبر `API_PORT`.

للدليل الكامل الخاص بـVS Code، راجع [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Typecheck, Build, and Tests

```bash
pnpm run typecheck
pnpm run build
pnpm test
```

حالياً لا توجد حزمة اختبارات آلية فعلية في المشروع؛ أمر `pnpm test` موجود
كواجهة موحدة ويمكن للحزم إضافة اختبارات مستقلة إليه لاحقاً. يجب تنفيذ فحوص
API اليدوية الأساسية قبل التسليم، كما هو موضح في دليل التطوير.

## API Code Generation

عدّل [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml) أولاً، ثم أعد توليد
العملاء والـschemas:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

لا تعدّل الملفات المولدة يدوياً.

## GitHub Workflow

- `main`: النسخة المستقرة الجاهزة للنشر
- `develop`: التطوير الرئيسي
- `feature/*`: تغييرات مستقلة قصيرة العمر

لا تدمج ميزات مباشرة إلى `main`. افتح Pull Request من `feature/*` إلى
`develop`، ثم من `develop` إلى `main` عند اعتماد الإصدار.

## Security

- لا ترفع `.env` أو أي credential إلى GitHub.
- استخدم `DATABASE_URL` من بيئة التشغيل فقط.
- API يستخدم Zod للتحقق من المدخلات.
- CORS مقيّد بنطاقات localhost وReplit المعروفة.
- API محمي بـrate limiting.
- لا تسجل logger قيم authorization أو cookies.
- لا تضع بيانات الإنتاج أو dump قاعدة البيانات داخل المستودع.

## Replit Notes

ملفات `.replit` و`.replit-artifact/` محفوظة لأنها جزء من تشغيل النسخة الحالية
على Replit، لكنها ليست مطلوبة لتشغيل AIX محلياً. التشغيل المحلي يعتمد على
Node.js وpnpm وPostgreSQL فقط، مع defaults محلية للـports وVite proxy.

## Current Status

**AIX v1.0.1 Hardening** — Arabic RTL MVP hardened for initial users and
prepared for local VS Code development.

## License

MIT