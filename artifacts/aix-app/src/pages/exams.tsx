import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isAfter, isToday, isBefore, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  useListExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useListSubjects,
  getListExamsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, MoreVertical, Pencil, Trash2, Loader2, CheckSquare, 
  Calendar as CalendarIcon, Clock, Target, AlertCircle, FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const examSchema = z.object({
  subjectId: z.coerce.number().min(1, "اختر المادة"),
  examDate: z.string().min(1, "تاريخ الاختبار مطلوب"),
  examTime: z.string().optional().or(z.literal("")),
  targetGrade: z.coerce.number().min(0).max(100).optional().or(z.literal(0)),
  notes: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

const editExamSchema = examSchema.extend({
  isCompleted: z.boolean(),
});

type EditExamFormValues = z.infer<typeof editExamSchema>;

export default function Exams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: exams, isLoading: examsLoading } = useListExams();
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [deletingExamId, setDeletingExamId] = useState<number | null>(null);

  const addForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: { subjectId: 0, examDate: format(new Date(), 'yyyy-MM-dd'), examTime: "", targetGrade: 0, notes: "" },
  });

  const editForm = useForm<EditExamFormValues>({
    resolver: zodResolver(editExamSchema),
    defaultValues: { subjectId: 0, examDate: "", examTime: "", targetGrade: 0, notes: "", isCompleted: false },
  });

  const onAddOpenChange = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      setTimeout(() => {
        addForm.reset({ subjectId: subjects?.[0]?.id || 0, examDate: format(new Date(), 'yyyy-MM-dd'), examTime: "", targetGrade: 0, notes: "" });
      }, 200);
    } else if (subjects && subjects.length > 0 && addForm.getValues().subjectId === 0) {
      addForm.setValue("subjectId", subjects[0].id);
    }
  };

  const openEdit = (exam: any) => {
    setEditingExam(exam);
    editForm.reset({
      subjectId: exam.subjectId,
      examDate: exam.examDate,
      examTime: exam.examTime || "",
      targetGrade: exam.targetGrade || 0,
      notes: exam.notes || "",
      isCompleted: exam.isCompleted,
    });
  };

  const onAddSubmit = async (data: ExamFormValues) => {
    try {
      await createExam.mutateAsync({ 
        data: { 
          ...data, 
          examTime: data.examTime || null,
          targetGrade: data.targetGrade || null,
          notes: data.notes || null
        } 
      });
      toast({ title: "تمت الإضافة", description: "تمت إضافة الاختبار بنجاح." });
      queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      onAddOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ الاختبار." });
    }
  };

  const onEditSubmit = async (data: EditExamFormValues) => {
    if (!editingExam) return;
    try {
      await updateExam.mutateAsync({ 
        examId: editingExam.id, 
        data: { 
          ...data, 
          examTime: data.examTime || null,
          targetGrade: data.targetGrade || null,
          notes: data.notes || null
        } 
      });
      toast({ title: "تم التعديل", description: "تم تحديث الاختبار بنجاح." });
      queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setEditingExam(null);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ الاختبار." });
    }
  };

  const toggleExamStatus = async (exam: any) => {
    try {
      await updateExam.mutateAsync({ 
        examId: exam.id, 
        data: { isCompleted: !exam.isCompleted } 
      });
      queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الحالة." });
    }
  };

  const confirmDelete = async () => {
    if (!deletingExamId) return;
    try {
      await deleteExam.mutateAsync({ examId: deletingExamId });
      queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ title: "تم الحذف", description: "تم حذف الاختبار بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف." });
    } finally {
      setDeletingExamId(null);
    }
  };

  // Sort and categorize exams
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const upcomingExams = exams?.filter(e => !e.isCompleted && !isBefore(new Date(e.examDate), today)) || [];
  const pastExams = exams?.filter(e => e.isCompleted || isBefore(new Date(e.examDate), today)) || [];

  if (examsLoading || subjectsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">الاختبارات والمشاريع</h1>
          <p className="text-muted-foreground">تابع مواعيد اختباراتك القادمة واستعد لها جيداً.</p>
        </div>
        <Button onClick={() => onAddOpenChange(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> إضافة اختبار
        </Button>
      </header>

      {exams?.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card border-dashed mt-8">
          <CheckSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">لا توجد اختبارات مجدولة</h3>
          <p className="text-muted-foreground mb-4">أضف تواريخ اختباراتك القادمة ليقوم AIX بتذكيرك بها وتجهيزك لها.</p>
          <Button onClick={() => onAddOpenChange(true)} variant="outline">أضف اختبارك الأول</Button>
        </div>
      ) : (
        <div className="space-y-10">
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2">القادمة</h2>
              <div className="space-y-4">
                {upcomingExams.map(exam => {
                  const examDate = new Date(exam.examDate);
                  const isUrgent = isBefore(examDate, nextWeek);
                  
                  return (
                    <Card key={exam.id} className={`overflow-hidden transition-all hover-elevate border-l-4 ${isUrgent ? 'border-amber-500' : ''}`} style={{ borderLeftColor: isUrgent ? undefined : exam.subjectColor }}>
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row items-stretch">
                          <div className={`p-4 flex flex-col items-center justify-center min-w-[100px] border-l sm:border-l-0 sm:border-r border-b sm:border-b-0 ${isUrgent ? 'bg-amber-500/10 text-amber-600' : 'bg-muted/30'}`}>
                            <span className="text-sm font-medium">{format(examDate, 'MMM', { locale: ar })}</span>
                            <span className="text-3xl font-bold leading-none">{format(examDate, 'dd')}</span>
                            <span className="text-xs mt-1">{format(examDate, 'EEEE', { locale: ar })}</span>
                          </div>
                          
                          <div className="p-4 flex-1 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: exam.subjectColor }}></span>
                                <h3 className="font-bold text-lg leading-none">{exam.subjectName}</h3>
                                {isUrgent && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0 px-2 h-5 gap-1"><AlertCircle className="w-3 h-3"/> قريب جداً</Badge>}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {exam.examTime && (
                                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> <span className="dir-ltr">{exam.examTime}</span></span>
                                )}
                                {exam.targetGrade ? (
                                  <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> الهدف: {exam.targetGrade}%</span>
                                ) : null}
                                {exam.notes && (
                                  <span className="flex items-center gap-1.5 line-clamp-1 max-w-[200px]" title={exam.notes}><FileText className="w-4 h-4" /> {exam.notes}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <Button variant="outline" size="sm" onClick={() => toggleExamStatus(exam)} className="gap-2 shrink-0">
                                تعيين كمكتمل
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(exam)} className="cursor-pointer gap-2">
                                    <Pencil className="w-4 h-4" /> تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeletingExamId(exam.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 gap-2">
                                    <Trash2 className="w-4 h-4" /> حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {pastExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2 opacity-50">السابقة والمكتملة</h2>
              <div className="space-y-4 opacity-75">
                {pastExams.map(exam => {
                  const examDate = new Date(exam.examDate);
                  
                  return (
                    <Card key={exam.id} className="overflow-hidden border-l-4 bg-muted/20" style={{ borderLeftColor: exam.subjectColor }}>
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row items-stretch">
                          <div className="p-3 flex flex-col items-center justify-center min-w-[80px] bg-muted/50 border-l sm:border-l-0 sm:border-r border-b sm:border-b-0 opacity-70">
                            <span className="text-xl font-bold">{format(examDate, 'dd/MM')}</span>
                          </div>
                          
                          <div className="p-3 flex-1 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${exam.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{exam.subjectName}</h3>
                                {exam.isCompleted && <Badge variant="secondary" className="text-[10px] h-5 bg-green-500/10 text-green-600">مكتمل</Badge>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!exam.isCompleted && (
                                <Button variant="ghost" size="sm" onClick={() => toggleExamStatus(exam)} className="h-8 text-xs">
                                  مكتمل؟
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => setDeletingExamId(exam.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة اختبار جديد</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 pt-2">
              <FormField control={addForm.control} name="subjectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>المادة</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {subjects?.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={addForm.control} name="examDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاختبار</FormLabel>
                    <FormControl><Input type="date" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={addForm.control} name="examTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوقت (اختياري)</FormLabel>
                    <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={addForm.control} name="targetGrade" render={({ field }) => (
                <FormItem>
                  <FormLabel>الدرجة المستهدفة (اختياري)</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} placeholder="مثال: 95" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (فصول محددة، مراجع...)</FormLabel>
                  <FormControl><Textarea placeholder="مثال: من الفصل الأول للثالث..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createExam.isPending} className="w-full">
                  {createExam.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ الاختبار
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingExam} onOpenChange={(o) => !o && setEditingExam(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الاختبار</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <FormField control={editForm.control} name="subjectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>المادة</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {subjects?.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="examDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاختبار</FormLabel>
                    <FormControl><Input type="date" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="examTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوقت (اختياري)</FormLabel>
                    <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={editForm.control} name="targetGrade" render={({ field }) => (
                <FormItem>
                  <FormLabel>الدرجة المستهدفة</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={editForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={editForm.control} name="isCompleted" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm space-y-0 mt-4 bg-muted/30">
                  <div>
                    <FormLabel>اختبار مكتمل</FormLabel>
                  </div>
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={updateExam.isPending} className="w-full">
                  {updateExam.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingExamId} onOpenChange={(o) => !o && setDeletingExamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الاختبار</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteExam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
