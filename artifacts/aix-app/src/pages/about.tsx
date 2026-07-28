import {
  Brain,
  Shield,
  Zap,
  BookOpen,
  Layers,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Database,
  AlignRight,
  ShieldCheck,
  GitBranch,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VERSION = "v1.0.1 Hardening";
const RELEASE_DATE = "28 يوليو 2026";

export default function About() {
  const principles = [
    { title: "الخصوصية أولاً",    desc: "بياناتك لك وحدك، يتم معالجتها محلياً وتخزينها بأمان.",             icon: Shield },
    { title: "النظام يقترح القرار", desc: "أنت لا تبحث عما يجب أن تفعله، AIX يحلل ويقترح عليك.",             icon: Brain },
    { title: "البساطة أولاً",      desc: "واجهة خالية من التشتيت. التركيز فقط على الدراسة.",                 icon: Zap },
    { title: "التطوير المستمر",    desc: "العقل الرقمي يتعلم من عاداتك ويتحسن مع الوقت.",                   icon: CheckCircle2 },
    { title: "بنية Modular",       desc: "نظام قابل للتوسع والإضافة حسب احتياجاتك.",                        icon: Layers },
    { title: "أبحاث موثوقة",       desc: "مبني على أحدث نظريات التعلم المعرفي الموثوقة.",                   icon: BookOpen },
  ];

  const updates = [
    { title: "تحسين أمان النظام",               desc: "تقييد CORS وإضافة Rate Limiting لحماية API.",     icon: Lock },
    { title: "Global Error Handler",             desc: "معالجة مركزية للأخطاء تمنع توقف الخادم.",         icon: AlertTriangle },
    { title: "تحسين محرك القرار الذكي",         desc: "فلترة الاختبارات المنتهية وتحسين Confidence Score.", icon: Brain },
    { title: "تحسين أداء قاعدة البيانات",       desc: "إصلاح N+1 Queries واستخدام JOIN واحد بدلاً من N.", icon: Database },
    { title: "إصلاح مشاكل RTL",                 desc: "تصحيح اتجاه الأيقونات والعناصر في الواجهة العربية.", icon: AlignRight },
    { title: "تحسين حماية API",                 desc: "إضافة فحص ملكية البيانات في جميع الـ endpoints.",   icon: ShieldCheck },
    { title: "تحسين بنية المشروع",              desc: "توحيد Modular Architecture وفصل المسؤوليات.",        icon: GitBranch },
  ];

  const leadership = [
    { role: "المؤسس وصاحب الرؤية",       name: "المهندس أيهم محمد حسين قعشان" },
    { role: "المدير التنفيذي (CEO)",      name: "المهندس أيهم محمد حسين قعشان" },
    { role: "المهندس التنفيذي (Executive Engineer)", name: "المهندس أيهم محمد حسين قعشان" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="text-center space-y-6 py-10 border-b relative">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-50 -z-10 rounded-3xl" />
        <div className="inline-flex items-center justify-center p-4 bg-card shadow-lg rounded-2xl mb-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              A
            </div>
            <span className="font-bold text-4xl tracking-tight">AIX</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Artificial Intelligence eXperience
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          نحن لا نبني تطبيق To-Do، نبني عقلاً رقمياً شخصياً يتطور مع المستخدم.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {VERSION}
          </Badge>
          <span className="text-sm text-muted-foreground">{RELEASE_DATE}</span>
        </div>
      </section>

      {/* ── Vision & Mission ─────────────────────────────────────────── */}
      <section className="grid md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">الرؤية</h2>
            <p className="text-lg leading-relaxed">
              بناء نظام ذكاء شخصي يساعد الإنسان على اتخاذ القرار الصحيح في الوقت
              الصحيح، متجاوزاً بذلك قوائم المهام التقليدية المربكة.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">الرسالة</h2>
            <p className="text-lg leading-relaxed">
              توفير بيئة رقمية هادئة ودقيقة، خالية من التشتت، تعمل كعقل ثانٍ
              للطالب لإدارة حياته الأكاديمية بكفاءة عالية وبدون قلق.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Principles ───────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">
        <h2 className="text-3xl font-bold text-center mb-8">مبادئنا الستة</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {principles.map((p, i) => (
            <Card
              key={i}
              className="border-none shadow-sm bg-card hover-elevate transition-all group"
            >
              <CardContent className="p-6">
                <p.icon className="w-8 h-8 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Latest Updates ───────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">آخر التحديثات</h2>
          <Badge className="text-sm px-3 py-1">{VERSION}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {updates.map((u, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/70 transition-colors"
            >
              <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <u.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{u.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Leadership ───────────────────────────────────────────────── */}
      <section className="mt-12 pt-8 border-t space-y-6">
        <h2 className="text-2xl font-bold text-center">القيادة</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {leadership.map((l, i) => (
            <Card key={i} className="border-none shadow-sm bg-card text-center">
              <CardContent className="p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  أ
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{l.role}</p>
                <p className="font-bold text-sm leading-snug">{l.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <section className="pt-4 border-t text-center space-y-2 text-muted-foreground text-sm">
        <div className="flex justify-center gap-4">
          <span>الإصدار: {VERSION}</span>
          <span>•</span>
          <span>تاريخ التحديث: {RELEASE_DATE}</span>
          <span>•</span>
          <span>التأسيس: 2026</span>
        </div>
      </section>

    </div>
  );
}
