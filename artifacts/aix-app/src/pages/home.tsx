import { Link } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Brain, ArrowRight, Target, BookOpen, CheckSquare, Clock, Trophy, AlertTriangle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 text-center text-destructive">
        <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-xl font-bold">حدث خطأ أثناء تحميل البيانات</h2>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{summary.welcomeMessage}</h1>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <Target className="w-5 h-5" /> هدفك السنوي: <span className="font-semibold text-foreground">{summary.annualGoal}</span>
          </p>
        </div>
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-4 min-w-[200px] shadow-sm">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">التقدم العام</span>
              <span className="text-sm font-bold text-primary">{Math.round(summary.overallProgress)}%</span>
            </div>
            <Progress value={summary.overallProgress} className="h-2" />
          </div>
        </div>
      </header>

      {/* The Smart Decision Card - AIX core feature */}
      <section>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Brain className="w-6 h-6" />
              القرار الذكي
            </CardTitle>
            <CardDescription>ماذا يقترح AIX أن تدرس الآن؟</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {summary.suggestedLesson ? (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: summary.suggestedLesson.subjectColor || '#3b82f6' }}
                    />
                    <h3 className="text-2xl font-bold">{summary.suggestedLesson.lessonName}</h3>
                    <Badge variant="outline" className="text-xs">{summary.suggestedLesson.subjectName}</Badge>
                  </div>
                  <p className="text-muted-foreground flex items-start gap-2">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{summary.suggestedLesson.reason}</span>
                  </p>
                </div>
                <Button size="lg" asChild className="shrink-0 w-full md:w-auto hover-elevate">
                  <Link href={`/subjects/${summary.suggestedLesson.subjectId}`}>
                    ابدأ الدراسة <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">لا توجد دروس مقترحة حالياً. أضف المزيد من المواد والدروس ليتمكن AIX من مساعدتك.</p>
                <Button variant="outline" asChild>
                  <Link href="/subjects">إدارة المواد</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold">{summary.totalSubjects}</h4>
            <p className="text-sm text-muted-foreground">مواد مسجلة</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold">{summary.upcomingExams}</h4>
            <p className="text-sm text-muted-foreground">اختبارات قادمة</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold">{summary.lessonsNeedingReview}</h4>
            <p className="text-sm text-muted-foreground">دروس للمراجعة</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all relative overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6" />
            </div>
            {summary.lastAchievement ? (
              <>
                <h4 className="text-sm font-bold line-clamp-1">{summary.lastAchievement.name}</h4>
                <p className="text-xs text-muted-foreground">آخر إنجاز</p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-muted-foreground">لا يوجد</h4>
                <p className="text-xs text-muted-foreground">ابدأ الدراسة لكسب الشارات</p>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
