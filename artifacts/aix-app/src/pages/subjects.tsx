import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListSubjects, 
  useCreateSubject, 
  useUpdateSubject, 
  useDeleteSubject,
  getListSubjectsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Plus, MoreVertical, Pencil, Trash2, Loader2, UserRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const subjectSchema = z.object({
  name: z.string().min(1, "اسم المادة مطلوب"),
  color: z.string().min(4, "اللون مطلوب"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  teacher: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

const DIFFICULTY_MAP = {
  easy: { label: "سهل", color: "bg-green-500/10 text-green-500" },
  medium: { label: "متوسط", color: "bg-amber-500/10 text-amber-500" },
  hard: { label: "صعب", color: "bg-red-500/10 text-red-500" },
};

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#ec4899", "#14b8a6", "#6366f1", "#f43f5e"
];

export default function Subjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading } = useListSubjects();
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<number | null>(null);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      color: COLORS[0],
      difficulty: "medium",
      teacher: "",
    },
  });

  const onOpenChange = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingSubject(null);
        form.reset({ name: "", color: COLORS[0], difficulty: "medium", teacher: "" });
      }, 200);
    }
  };

  const openEdit = (subject: any) => {
    setEditingSubject(subject);
    form.reset({
      name: subject.name,
      color: subject.color,
      difficulty: subject.difficulty,
      teacher: subject.teacher || "",
    });
    setIsAddOpen(true);
  };

  const onSubmit = async (data: SubjectFormValues) => {
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ 
          subjectId: editingSubject.id, 
          data: { ...data, teacher: data.teacher || null } 
        });
        toast({ title: "تم التعديل", description: "تم تعديل المادة بنجاح." });
      } else {
        await createSubject.mutateAsync({ 
          data: { ...data, teacher: data.teacher || null } 
        });
        toast({ title: "تمت الإضافة", description: "تمت إضافة المادة بنجاح." });
      }
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ المادة." });
    }
  };

  const confirmDelete = async () => {
    if (!deletingSubjectId) return;
    try {
      await deleteSubject.mutateAsync({ subjectId: deletingSubjectId });
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ title: "تم الحذف", description: "تم حذف المادة بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف." });
    } finally {
      setDeletingSubjectId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">المواد الدراسية</h1>
          <p className="text-muted-foreground">أدر موادك، راقب تقدمك فيها، وحدد مستويات الصعوبة.</p>
        </div>
        <Button onClick={() => onOpenChange(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> إضافة مادة
        </Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : subjects?.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">لا توجد مواد</h3>
          <p className="text-muted-foreground mb-4">لم تقم بإضافة أي مواد دراسية بعد.</p>
          <Button onClick={() => onOpenChange(true)} variant="outline">أضف مادتك الأولى</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject) => (
            <Card key={subject.id} className="overflow-hidden hover-elevate transition-all border-l-4 group" style={{ borderLeftColor: subject.color }}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    <Link href={`/subjects/${subject.id}`} className="hover:text-primary transition-colors">
                      {subject.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    {subject.teacher ? (
                      <><UserRound className="w-3.5 h-3.5" /> {subject.teacher}</>
                    ) : "بدون معلم محدد"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(subject)} className="cursor-pointer gap-2">
                      <Pencil className="w-4 h-4" /> تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletingSubjectId(subject.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 gap-2">
                      <Trash2 className="w-4 h-4" /> حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className={DIFFICULTY_MAP[subject.difficulty as keyof typeof DIFFICULTY_MAP].color}>
                  {DIFFICULTY_MAP[subject.difficulty as keyof typeof DIFFICULTY_MAP].label}
                </Badge>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t mt-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/subjects/${subject.id}`}>التفاصيل والدروس</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "تعديل مادة" : "إضافة مادة جديدة"}</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل المادة الدراسية لتتمكن من إضافة الدروس لها لاحقاً.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المادة</FormLabel>
                  <FormControl><Input placeholder="رياضيات، فيزياء..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>مستوى الصعوبة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="easy">سهل</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="hard">صعب</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="teacher" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المعلم / الدكتور (اختياري)</FormLabel>
                    <FormControl><Input placeholder="اسم المعلم" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel>اللون المميز</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${field.value === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => field.onChange(c)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending} className="w-full">
                  {(createSubject.isPending || updateSubject.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingSubject ? "حفظ التعديلات" : "إضافة المادة"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSubjectId} onOpenChange={(o) => !o && setDeletingSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه المادة نهائياً مع جميع الدروس المرتبطة بها والتقدم الذي أحرزته فيها. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteSubject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف المادة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
