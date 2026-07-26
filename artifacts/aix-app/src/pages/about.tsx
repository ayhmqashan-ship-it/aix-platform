import { Brain, Shield, Zap, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  const principles = [
    { title: "الخصوصية أولاً", desc: "بياناتك لك وحدك، يتم معالجتها محلياً وتخزينها بأمان.", icon: Shield },
    { title: "النظام يقترح القرار", desc: "أنت لا تبحث عما يجب أن تفعله، AIX يحلل ويقترح عليك.", icon: Brain },
    { title: "البساطة أولاً", desc: "واجهة خالية من التشتيت. التركيز فقط على الدراسة.", icon: Zap },
    { title: "التطوير المستمر", desc: "العقل الرقمي يتعلم من عاداتك ويتحسن مع الوقت.", icon: CheckCircle2 },
    { title: "بنية Modular", desc: "نظام قابل للتوسع والإضافة حسب احتياجاتك.", icon: Layers },
    { title: "أبحاث موثوقة", desc: "مبني على أحدث نظريات التعلم المعرفي الموثوقة.", icon: BookOpen },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
      
      {/* Hero */}
      <section className="text-center space-y-6 py-10 border-b relative">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-50 -z-10 rounded-3xl"></div>
        <div className="inline-flex items-center justify-center p-4 bg-card shadow-lg rounded-2xl mb-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">A</div>
            <span className="font-bold text-4xl tracking-tight">AIX</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Artificial Intelligence eXperience</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          نحن لا نبني تطبيق To-Do، نبني عقلاً رقمياً شخصياً يتطور مع المستخدم.
        </p>
      </section>

      {/* Vision & Mission */}
      <section className="grid md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">الرؤية</h2>
            <p className="text-lg leading-relaxed">
              بناء نظام ذكاء شخصي يساعد الإنسان على اتخاذ القرار الصحيح في الوقت الصحيح، متجاوزاً بذلك قوائم المهام التقليدية المربكة.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">الرسالة</h2>
            <p className="text-lg leading-relaxed">
              توفير بيئة رقمية هادئة ودقيقة، خالية من التشتت، تعمل كعقل ثانٍ للطالب لإدارة حياته الأكاديمية بكفاءة عالية وبدون قلق.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Principles */}
      <section className="space-y-6 pt-6">
        <h2 className="text-3xl font-bold text-center mb-8">مبادئنا الستة</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {principles.map((p, i) => (
            <Card key={i} className="border-none shadow-sm bg-card hover-elevate transition-all group">
              <CardContent className="p-6">
                <p.icon className="w-8 h-8 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Credits */}
      <section className="mt-12 pt-8 border-t text-center space-y-4 text-muted-foreground">
        <p className="font-medium text-foreground">
          القيادة: المؤسس والمدير التنفيذي — المهندس أيهم محمد حسين قعشان
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <span>الإصدار: v1.0.0 MVP</span>
          <span>•</span>
          <span>التأسيس: 2026</span>
        </div>
      </section>

    </div>
  );
}
