import { useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetSubject, 
  useGetSubjectProgress, 
  useListLessons, 
  useCreateLesson, 
  useUpdateLesson, 
  useDeleteLesson,
  getGetSubjectQueryKey,
  getGetSubjectProgressQueryKey,
  getListLessonsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, Plus, MoreVertical, Pencil, Trash2, Loader2, BookOpen, 
  CheckCircle2, Circle, AlertCircle, FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const lessonSchema = z.object({
  name: z.string().min(1, "اسم الدرس مطلوب"),
  notes: z.string().optional(),
});
type LessonFormValues = z.infer<typeof lessonSchema>;

const editLessonSchema = lessonSchema.extend({
  isCompleted: z.boolean(),
  isReviewed: z.boolean(),
  masteryLevel: z.number().min(0).max(100),
});
type EditLessonFormValues = z.infer<typeof editLessonSchema>;


export default function SubjectDetails() {
  const { id } = useParams();
  const subjectId = parseInt(id || "0", 10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subject, isLoading: subjectLoading } = useGetSubject(subjectId, {
    query: { enabled: !!subjectId, queryKey: getGetSubjectQueryKey(subjectId) }
  });
  const { data: progress, isLoading: progressLoading } = useGetSubjectProgress(subjectId, {
    query: { enabled: !!subjectId, queryKey: getGetSubjectProgressQueryKey(subjectId) }
  });
  const { data: lessons, isLoading: lessonsLoading } = useListLessons(subjectId, {
    query: { enabled: !!subjectId, queryKey: getListLessonsQueryKey(subjectId) }
  });

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);

  const addForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { name: "", notes: "" },
  });

  const editForm = useForm<EditLessonFormValues>({
    resolver: zodResolver(editLessonSchema),
    defaultValues: { name: "", notes: "", isCompleted: false, isReviewed: false, masteryLevel: 0 },
  });

  const onAddSubmit = async (data: LessonFormValues) => {
    try {
      await createLesson.mutateAsync({ subjectId, data: { ...data, notes: data.notes || null } });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetSubjectProgressQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setIsAddOpen(false);
      addForm.reset();
      toast({ title: "تمت الإضافة", description: "تمت إضافة الدرس بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء إضافة الدرس." });
    }
  };

  const openEdit = (lesson: any) => {
    setEditingLesson(lesson);
    editForm.reset({
      name: lesson.name,
      notes: lesson.notes || "",
      isCompleted: lesson.isCompleted,
      isReviewed: lesson.isReviewed,
      masteryLevel: lesson.masteryLevel,
    });
  };

  const onEditSubmit = async (data: EditLessonFormValues) => {
    if (!editingLesson) return;
    try {
      await updateLesson.mutateAsync({ lessonId: editingLesson.id, data: { ...data, notes: data.notes || null } });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetSubjectProgressQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setEditingLesson(null);
      toast({ title: "تم التعديل", description: "تم تعديل الدرس بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التعديل." });
    }
  };

  const toggleLessonStatus = async (lesson: any, field: 'isCompleted' | 'isReviewed') => {
    try {
      await updateLesson.mutateAsync({ 
        lessonId: lesson.id, 
        data: { [field]: !lesson[field] } 
      });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetSubjectProgressQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الحالة." });
    }
  };

  const confirmDelete = async () => {
    if (!deletingLessonId) return;
    try {
      await deleteLesson.mutateAsync({ lessonId: deletingLessonId });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetSubjectProgressQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ title: "تم الحذف", description: "تم حذف الدرس بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف." });
    } finally {
      setDeletingLessonId(null);
    }
  };

  if (subjectLoading || progressLoading || lessonsLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (!subject) return <div className="p-6 text-center text-destructive">لم يتم العثور على المادة.</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/subjects"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }}></span>
            {subject.name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            {subject.teacher && <span>المعلم: {subject.teacher}</span>}
          </p>
        </div>
      </div>

      {progress && (
        <Card className="bg-card shadow-sm border-muted">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">التقدم العام</span>
                <span className="text-xl font-bold" style={{ color: subject.color }}>{Math.round(progress.completionRate)}%</span>
              </div>
              <Progress value={progress.completionRate} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>{progress.completedLessons} من {progress.totalLessons} دروس منتهية</span>
                <span>متوسط الإتقان: {Math.round(progress.averageMastery)}%</span>
              </div>
            </div>
            
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.totalLessons}</div>
                <div className="text-xs text-muted-foreground">الدروس</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{progress.completedLessons}</div>
                <div className="text-xs text-muted-foreground">مكتملة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{progress.reviewedLessons}</div>
                <div className="text-xs text-muted-foreground">مُراجَعة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">الدروس</h2>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> إضافة درس
          </Button>
        </div>

        {lessons?.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-card border-dashed">
            <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium">لا توجد دروس بعد</h3>
            <p className="text-muted-foreground">أضف الدرس الأول لتبدأ تتبع تقدمك.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons?.map(lesson => (
              <Card key={lesson.id} className={`transition-all ${lesson.isCompleted ? 'bg-muted/30 opacity-80' : 'bg-card'}`}>
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  
                  <div className="flex gap-4 items-start w-full md:w-auto flex-1">
                    <button 
                      className="mt-1 shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                      onClick={() => toggleLessonStatus(lesson, 'isCompleted')}
                    >
                      {lesson.isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div>
                      <h3 className={`font-semibold text-lg ${lesson.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {lesson.name}
                      </h3>
                      {lesson.notes && (
                        <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1 line-clamp-1">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" /> {lesson.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-10 md:pl-0">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-[10px] text-muted-foreground mb-1">الإتقان</span>
                      <div className="flex items-center gap-2 w-full">
                        <Progress value={lesson.masteryLevel} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium w-6">{lesson.masteryLevel}%</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleLessonStatus(lesson, 'isReviewed')}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors min-w-[60px] ${lesson.isReviewed ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                      title={lesson.isReviewed ? "تمت المراجعة" : "يحتاج مراجعة"}
                    >
                      {lesson.isReviewed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span className="text-[10px]">مراجعة</span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(lesson)} className="gap-2 cursor-pointer">
                          <Pencil className="w-4 h-4" /> تعديل وتفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingLessonId(lesson.id)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
                          <Trash2 className="w-4 h-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة درس جديد</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField control={addForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الدرس</FormLabel>
                  <FormControl><Input placeholder="مقدمة في..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={addForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl><Textarea placeholder="روابط، أفكار هامة..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createLesson.isPending} className="w-full">
                  {createLesson.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  إضافة الدرس
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(o) => !o && setEditingLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الدرس</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الدرس</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                <FormField control={editForm.control} name="isCompleted" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-card p-3 shadow-sm space-y-0">
                    <div>
                      <FormLabel>مكتمل</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">هل أنهيت دراسة هذا الدرس؟</FormDescription>
                    </div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={editForm.control} name="isReviewed" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-card p-3 shadow-sm space-y-0">
                    <div>
                      <FormLabel>تمت المراجعة</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">هل راجعت الدرس قريباً؟</FormDescription>
                    </div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={editForm.control} name="masteryLevel" render={({ field }) => (
                  <FormItem className="space-y-4 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <FormLabel>مستوى الإتقان</FormLabel>
                      <span className="font-bold text-primary">{field.value}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0} max={100} step={5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={editForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={updateLesson.isPending} className="w-full">
                  {updateLesson.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLessonId} onOpenChange={(o) => !o && setDeletingLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدرس</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {deleteLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// Quick component for FormDescription to avoid missing imports
function FormDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={className}>{children}</p>;
}
