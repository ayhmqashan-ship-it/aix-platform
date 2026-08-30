# AIX Local Development Guide

هذا الدليل ينقل النسخة المرجعية من Replit إلى GitHub وVS Code بدون نقل أسرار
أو بيانات قاعدة البيانات.

## 1. Prerequisites

ثبّت:

- Node.js 24
- pnpm 10 أو أحدث
- PostgreSQL 14 أو أحدث
- VS Code مع إضافة ESLint/TypeScript المناسبة اختيارياً

تحقق:

```bash
node --version
pnpm --version
psql --version
```

## 2. Clone and Install

```bash
git clone <your-github-repository-url>
cd aix
pnpm install
```

استخدم pnpm فقط؛ المشروع يرفض npm وyarn في `preinstall` حتى لا يحدث اختلاف
في lockfile.

## 3. Environment

```bash
cp .env.example .env
```

ضع في `.env` قيمة اتصال PostgreSQL المحلية:

```text
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/aix_dev
```

لا تضع القيمة الحقيقية في README أو GitHub أو رسائل commit. حمّل البيئة في
كل terminal قبل تشغيل الأوامر:

```bash
set -a
source .env
set +a
```

المتغيرات الاختيارية:

- `PORT=8080`: API server
- `API_PORT=8080`: Vite proxy target
- `BASE_PATH=/`: frontend base path
- `NODE_ENV=development`
- `LOG_LEVEL=info`

## 4. PostgreSQL

أنشئ قاعدة محلية:

```bash
createuser aix_user
createdb -O aix_user aix_dev
```

إذا احتاج نظامك كلمة مرور، استخدمها داخل `.env` فقط. لا تضعها في shell
history أو المستودع.

لإنشاء الجداول في قاعدة جديدة باستخدام migration:

```bash
set -a; source .env; set +a
pnpm --filter @workspace/db run migrate
```

لتوليد migration بعد تعديل schema:

```bash
pnpm --filter @workspace/db run generate
```

لمراجعة schema بسرعة في بيئة تطوير فقط:

```bash
pnpm --filter @workspace/db run push
```

لا تشغّل `push` عشوائياً على production. لا توجد seed scripts في النسخة
الحالية، ولا يتم استيراد بيانات Replit أو production إلى GitHub.

## 5. Run in VS Code

افتح terminal أولاً:

```bash
set -a; source .env; set +a
pnpm --filter @workspace/api-server run dev
```

افتح terminal ثانياً:

```bash
set -a; source .env; set +a
pnpm --filter @workspace/aix-app run dev
```

العناوين:

- API health: `http://localhost:8080/api/healthz`
- Web: `http://localhost:5173/`

الواجهة تستخدم مسارات API نسبية، وVite يمرر `/api` إلى `127.0.0.1:8080`.
إذا غيّرت منفذ API، غيّر `API_PORT` في البيئة نفسها.

## 6. Checks

فحص TypeScript لكل libraries والـartifacts:

```bash
pnpm run typecheck
```

بناء كل packages:

```bash
pnpm run build
```

فحص مستقل:

```bash
pnpm --filter @workspace/aix-app run typecheck
pnpm --filter @workspace/api-server run typecheck
```

الاختبارات:

```bash
pnpm test
```

لا توجد حالياً suites آلية داخل المشروع؛ لذلك يجب اعتبار `pnpm test` نقطة
توسعة مستقبلية، مع تنفيذ فحوص API اليدوية التالية قبل handoff.

## 7. Manual API Smoke Checks

```bash
curl -i http://localhost:8080/api/healthz
curl -i http://localhost:8080/api/subjects
curl -i http://localhost:8080/api/dashboard/summary
curl -i http://localhost:8080/api/decision/suggest
curl -i http://localhost:8080/api/achievements
```

بعد إنشاء profile وsubject من الواجهة، اختبر:

1. register/profile
2. إنشاء مادة
3. إنشاء درس
4. إكمال الدرس
5. تغيير mastery level
6. إنشاء exam وschedule entry
7. Dashboard
8. Smart Decision
9. Achievements

## 8. OpenAPI Changes

عدّل `lib/api-spec/openapi.yaml` أولاً، ثم:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
pnpm run typecheck
```

لا تعدل generated client أو generated Zod يدوياً.

## 9. Git Branching

```bash
git checkout main
git pull
git checkout -b feature/short-description
```

التدفق المقترح:

```text
feature/* → develop → main
```

استخدم commits صغيرة وواضحة، ولا ترفع `.env` أو `dist` أو `node_modules`.

## 10. Replit Compatibility

Replit يستمر باستخدام:

- `.replit`
- `.replit-artifact/artifact.toml`
- workflow commands
- injected `PORT` و`BASE_PATH`

الـdefaults المحلية لا تلغي إعدادات Replit؛ قيم workflow تبقى لها الأولوية.
لا تحذف ملفات Replit الضرورية من المستودع المرجعي.