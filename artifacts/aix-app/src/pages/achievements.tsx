import { useGetAchievements } from "@workspace/api-client-react";
import { Trophy, Flame, CalendarDays, BookOpen, CheckSquare, Layers, Lock, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Achievements() {
  const { data: achievements, isLoading } = useGetAchievements();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-8 w-32 mt-12 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!achievements) return null;

  const stats = [
    { label: "أيام الدراسة", value: achievements.totalStudyDays, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "السلسلة الحالية", value: achievements.currentStreak, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "أطول سلسلة", value: achievements.longestStreak, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "الدروس المكتملة", value: achievements.completedLessons, icon: BookOpen, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "الاختبارات المنجزة", value: achievements.completedExams, icon: CheckSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "إجمالي المواد", value: achievements.totalSubjects, icon: Layers, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          الإنجازات والإحصائيات
        </h1>
        <p className="text-muted-foreground text-lg">تتبع تقدمك واحتفل بانتصاراتك الصغيرة.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover-elevate transition-all border-none shadow-sm bg-card/50">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className={`w-14 h-14 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-1`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-3xl font-bold leading-none mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badges Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            الشارات
          </h2>
          <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {achievements.badges.filter(b => b.isEarned).length} من {achievements.badges.length}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {achievements.badges.map((badge) => (
            <Card 
              key={badge.id} 
              className={`overflow-hidden transition-all duration-500 flex flex-col items-center justify-center p-6 text-center h-full min-h-[180px]
                ${badge.isEarned ? 'border-primary/50 bg-gradient-to-br from-card to-primary/5 shadow-md hover:-translate-y-1' : 'border-dashed bg-muted/20 opacity-60 grayscale-[0.8]'}
              `}
            >
              <div className="relative mb-4 shrink-0">
                {badge.isEarned ? (
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)] border-2 border-primary/30">
                    <Award className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                    <Lock className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              <h3 className={`font-bold mb-1 leading-tight ${badge.isEarned ? 'text-primary' : 'text-muted-foreground'}`}>
                {badge.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-snug">
                {badge.description}
              </p>
              
              {badge.isEarned && badge.earnedAt && (
                <div className="mt-auto pt-3 text-[10px] font-medium text-primary/70">
                  تم اكتسابها: {format(new Date(badge.earnedAt), 'dd MMM yyyy', { locale: ar })}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
