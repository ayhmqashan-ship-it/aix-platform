import { useState } from "react";
import { Link } from "wouter";
import { useGetSuggestion } from "@workspace/api-client-react";
import { 
  Brain, ArrowLeft, Target, Zap, AlertCircle, RefreshCw, 
  Lightbulb, Sparkles, BookOpen, Clock, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSuggestionQueryKey } from "@workspace/api-client-react";

export default function Decision() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: suggestion, isLoading, isError, refetch } = useGetSuggestion({
    query: { 
      queryKey: getGetSuggestionQueryKey(),
      refetchOnWindowFocus: true
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 800); // Visual feedback
  };

  const getPriorityConfig = (level: string) => {
    switch (level) {
      case 'critical': return { label: 'حرجة', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle };
      case 'high': return { label: 'عالية', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Activity };
      case 'medium': return { label: 'متوسطة', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock };
      case 'low': return { label: 'منخفضة', color: 'text-green-500', bg: 'bg-green-500/10', icon: Target };
      default: return { label: 'عادية', color: 'text-primary', bg: 'bg-primary/10', icon: Brain };
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-30"></div>
        <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-8">
          <Brain className="w-20 h-20 text-primary/40 animate-pulse" />
          <h2 className="text-2xl font-bold text-center">جاري تحليل بياناتك...</h2>
          <div className="w-full space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
            <Skeleton className="h-4 w-4/6 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !suggestion) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 pattern-grid-lg opacity-30"></div>
        <Card className="relative z-10 w-full max-w-md border-dashed border-2">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <Lightbulb className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold mb-2">لا توجد اقتراحات حالياً</h2>
            <p className="text-muted-foreground mb-6">
              لم يتمكن AIX من تحديد درس للدراسة. قد يعود ذلك لعدم وجود مواد أو دروس، أو لأنك أكملت كل شيء!
            </p>
            <div className="flex gap-4 w-full">
              <Button onClick={handleRefresh} variant="outline" className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" /> تحديث
              </Button>
              <Button asChild className="flex-1 gap-2">
                <Link href="/subjects"><BookOpen className="w-4 h-4" /> إدارة المواد</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pConfig = getPriorityConfig(suggestion.priorityLevel);
  const PriorityIcon = pConfig.icon;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 pattern-grid-lg opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-700">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">القرار الذكي</h1>
          <p className="text-muted-foreground text-lg">بناءً على تقدمك ومواعيد اختباراتك، هذا ما يجب أن تركز عليه الآن.</p>
        </div>

        <Card className="border-2 shadow-2xl relative overflow-hidden" style={{ borderColor: `${suggestion.subjectColor}40` }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: suggestion.subjectColor }}></div>
          
          <CardContent className="p-8 md:p-10 flex flex-col items-center text-center relative">
            <div className="absolute top-4 left-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground"
                title="طلب اقتراح آخر"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Badge variant="outline" className={`mb-6 ${pConfig.bg} ${pConfig.color} border-none px-3 py-1 gap-1.5 text-sm`}>
              <PriorityIcon className="w-4 h-4" /> الأولوية: {pConfig.label}
            </Badge>

            <div className="mb-2">
              <span className="text-sm font-bold tracking-wider uppercase opacity-70" style={{ color: suggestion.subjectColor }}>
                {suggestion.subjectName}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
              {suggestion.lessonName}
            </h2>

            <div className="w-full max-w-md bg-muted/30 p-6 rounded-2xl mb-8 relative">
              <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-amber-500 fill-amber-500/20" />
              <p className="text-lg md:text-xl font-medium leading-relaxed">"{suggestion.reason}"</p>
            </div>

            <div className="w-full max-w-xs mb-10">
              <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                <span>مستوى الثقة بالقرار</span>
                <span>{suggestion.confidenceScore}%</span>
              </div>
              <Progress value={suggestion.confidenceScore} className="h-2" />
            </div>

            <Button size="lg" asChild className="w-full max-w-xs h-14 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover-elevate group">
              <Link href={`/subjects/${suggestion.subjectId}`}>
                بدء الدراسة الآن <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
