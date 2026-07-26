import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, ArrowLeft, Brain, Target, Clock, Zap } from "lucide-react";
import { useUpsertUserProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetUserProfileQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const profileSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  age: z.coerce.number().min(5, "العمر غير صالح").max(100, "العمر غير صالح"),
  educationLevel: z.string().min(1, "المرحلة الدراسية مطلوبة"),
  school: z.string().min(1, "المدرسة / الجامعة مطلوبة"),
  major: z.string().optional(),
  country: z.string().min(1, "الدولة مطلوبة"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  annualGoal: z.string().min(3, "الهدف السنوي مطلوب"),
  targetGrade: z.coerce.number().min(0).max(100),
  dailyStudyHours: z.coerce.number().min(0).max(24),
  sleepTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة (HH:MM)"),
  wakeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "صيغة الوقت غير صحيحة (HH:MM)"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const educationLevels = ["ابتدائي", "متوسط", "ثانوي", "جامعي", "دراسات عليا"];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 18,
      educationLevel: "",
      school: "",
      major: "",
      country: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      annualGoal: "",
      targetGrade: 95,
      dailyStudyHours: 4,
      sleepTime: "23:00",
      wakeTime: "06:00",
    },
  });

  const upsertProfile = useUpsertUserProfile();

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await upsertProfile.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      toast({
        title: "تم تهيئة العقل الرقمي بنجاح",
        description: "مرحباً بك في AIX.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات.",
      });
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["name", "age", "educationLevel", "school", "major", "country"];
    if (step === 2) fieldsToValidate = ["annualGoal", "targetGrade"];
    
    const isStepValid = await form.trigger(fieldsToValidate);
    if (isStepValid) setStep((s) => Math.min(totalSteps, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Visual / Branding Side */}
      <div className="hidden md:flex flex-1 bg-card border-l p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-50 z-0"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">A</div>
          <span className="font-bold text-2xl tracking-tight">AIX</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            نحن لا نبني تطبيق مهام،<br />
            <span className="text-primary">نبني عقلاً رقمياً شخصياً.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            AIX يساعدك على اتخاذ القرار الصحيح: "ماذا أدرس الآن؟" ليكون رفيقك الذكي في رحلتك الدراسية.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-muted-foreground font-medium">
          <Zap className="w-5 h-5 text-primary" />
          <span>تهيئة النظام الأساسي...</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 max-w-2xl mx-auto w-full relative z-10 bg-background">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">إعداد الملف الشخصي</h2>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">الخطوة {step} من {totalSteps}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-primary font-medium mb-6 bg-primary/10 p-3 rounded-lg">
                  <Brain className="w-5 h-5" />
                  <h3>المعلومات الأساسية</h3>
                </div>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input placeholder="أحمد محمد..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العمر</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدولة</FormLabel>
                      <FormControl><Input placeholder="السعودية، مصر..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المرحلة الدراسية</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المرحلة الدراسية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {educationLevels.map(lvl => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="school" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدرسة / الجامعة</FormLabel>
                    <FormControl><Input placeholder="اسم المؤسسة التعليمية" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="major" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التخصص (اختياري)</FormLabel>
                    <FormControl><Input placeholder="علوم حاسب، طب..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-primary font-medium mb-6 bg-primary/10 p-3 rounded-lg">
                  <Target className="w-5 h-5" />
                  <h3>الأهداف الأكاديمية</h3>
                </div>
                <FormField control={form.control} name="annualGoal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهدف السنوي</FormLabel>
                    <FormControl><Input placeholder="مثال: التخرج بمرتبة الشرف الأولى..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetGrade" render={({ field }) => (
                  <FormItem className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base">الدرجة المستهدفة الكلية</FormLabel>
                      <span className="font-bold text-xl text-primary">{field.value}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0} max={100} step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-primary font-medium mb-6 bg-primary/10 p-3 rounded-lg">
                  <Clock className="w-5 h-5" />
                  <h3>الجدول والروتين</h3>
                </div>
                <FormField control={form.control} name="dailyStudyHours" render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>ساعات الدراسة اليومية</FormLabel>
                      <span className="font-bold text-lg text-primary">{field.value} ساعات</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1} max={16} step={0.5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <FormField control={form.control} name="sleepTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت النوم</FormLabel>
                      <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="wakeTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت الاستيقاظ</FormLabel>
                      <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 mt-6 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                  <ArrowRight className="w-4 h-4" /> السابق
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} className="gap-2">
                  التالي <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={upsertProfile.isPending} className="gap-2 px-8">
                  {upsertProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  إطلاق العقل الرقمي <Zap className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
