# AIX Architecture

## Scope

AIX هو نظام دراسة شخصي عربي RTL. النسخة الحالية هي v1.0.1 Hardening، وتستخدم
محرك قرار محلياً وقاعدة PostgreSQL واحدة. تم الحفاظ على فصل الواجهة والخادم
والمكتبات المشتركة حتى يمكن إضافة المصادقة ومحركات الذاكرة لاحقاً دون إعادة
بناء المنتج.

## Logical Data Flow

```text
User
  ↓
React pages and components
  ↓
@workspace/api-client-react
  ↓
Express /api routes
  ↓
Domain route logic and decisionEngine
  ↓
@workspace/db + Drizzle ORM
  ↓
PostgreSQL
```

## Frontend

المسار `artifacts/aix-app/src/` هو تطبيق React + Vite:

- `App.tsx`: routing وReact Query provider
- `components/`: layout وshadcn/ui components
- `pages/`: register, home, subjects, lessons, schedule, exams,
  achievements, decision, about
- `hooks/`: hooks مشتركة
- `lib/`: utilities

التطبيق يستخدم `wouter` للتوجيه وReact Query hooks المولدة. الواجهة لا تبني
عقود API يدوياً؛ تستوردها من `@workspace/api-client-react`.

في التطوير المحلي، Vite يمرر `/api` إلى API server على `API_PORT`. في Replit
يستمر router الخارجي في تقديم المسارات المعرّفة في artifact manifests.

## Backend

المسار `artifacts/api-server/src/` هو Express API:

- `app.ts`: logging, CORS, body parsing, rate limiting, route mounting,
  global errors
- `index.ts`: قراءة port وتشغيل الخادم
- `routes/index.ts`: تسجيل routers
- `routes/`: module مستقل لكل domain
- `lib/decisionEngine.ts`: scoring algorithm نقي وقابل للاختبار
- `lib/logger.ts`: pino مع redaction للـcredentials
- `middlewares/errorHandler.ts`: 404 وglobal error response

كل router مسؤول عن domain محدد. لا يتم وضع منطق واجهة أو SQL خام داخل
الواجهة. في MVP، user scope هو `userId=1` داخل route handlers، وهو قرار
مؤقت موثق في `replit.md`.

## Database

المسار `lib/db/src/schema/` هو مصدر الحقيقة لجداول Drizzle:

- `users`
- `subjects`
- `lessons`
- `schedule_entries`
- `exams`
- `study_sessions`

`lib/db/src/index.ts` ينشئ PostgreSQL pool من `DATABASE_URL` ويصدر `db`
والـschema. لا توجد بيانات seed أو production داخل المستودع.

`lib/db/drizzle/` يحتوي migrations قابلة للتطبيق على قاعدة محلية جديدة.
استخدم `migrate` لقاعدة جديدة و`push` فقط بعد مراجعة مناسبة لقاعدة موجودة.

## OpenAPI and Generated Contracts

التدفق المعتمد هو:

```text
lib/api-spec/openapi.yaml
  ├── Orval → lib/api-client-react/src/generated/
  └── Orval → lib/api-zod/src/generated/
```

`openapi.yaml` هو العقد الوحيد الذي يجب تعديله عند تغيير request/response.
بعد أي تعديل:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

لا تعدّل الملفات داخل `generated/` يدوياً.

## Decision Engine

`artifacts/api-server/src/lib/decisionEngine.ts` يستقبل candidates وupcoming
exams ويعيد درساً واحداً مع:

- priority level
- confidence score من 0 إلى 100
- سبب عربي قابل للفهم

يحسب المحرك قرب الاختبار، صعوبة المادة، mastery، حالة الإكمال والمراجعة.
الـroutes مسؤولة عن جلب البيانات وفلترة الاختبارات المنتهية قبل تمريرها
للمحرك؛ المحرك نفسه لا يعتمد على Express أو Drizzle.

## Modules and Extension

إضافة domain جديدة تكون عبر:

1. schema جديد أو تعديل schema عند الحاجة
2. route module مستقل
3. OpenAPI contract
4. codegen
5. تسجيل router في `routes/index.ts`
6. client usage في الواجهة

هذا يمنع تكرار أنواع API ويحافظ على حدود واضحة بين transport وbusiness logic
وdata access.

## Replit Boundaries

الاعتماد على Replit محصور في:

- artifact manifests داخل `.replit-artifact/`
- workflows في `.replit`
- plugins التطويرية مثل cartographer وdev banner
- متغيرات تشغيل injected مثل `PORT` و`BASE_PATH`

هذه ليست متطلبات للـdomain logic. التشغيل خارج Replit يستخدم defaults في
Vite وAPI، ويحتاج فقط إلى PostgreSQL و`DATABASE_URL`.