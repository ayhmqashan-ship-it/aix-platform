import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListScheduleEntries,
  useCreateScheduleEntry,
  useUpdateScheduleEntry,
  useDeleteScheduleEntry,
  useListSubjects,
  getListScheduleEntriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, MoreVertical, Pencil, Trash2, Loader2, Calendar as CalendarIcon, Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const DAYS = [
  { id: 0, label: "الأحد" },
  { id: 1, label: "الإثنين" },
  { id: 2, label: "الثلاثاء" },
  { id: 3, label: "الأربعاء" },
  { id: 4, label: "الخميس" },
  { id: 5, label: "الجمعة" },
  { id: 6, label: "السبت" },
];

const scheduleSchema = z.object({
  subjectId: z.coerce.number().min(1, "اختر المادة"),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "وقت غير صالح"),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "وقت غير صالح"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function Schedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: schedule, isLoading: scheduleLoading } = useListScheduleEntries();
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  
  const createEntry = useCreateScheduleEntry();
  const updateEntry = useUpdateScheduleEntry();
  const deleteEntry = useDeleteScheduleEntry();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      subjectId: 0,
      dayOfWeek: 0,
      startTime: "08:00",
      endTime: "09:00",
    },
  });

  const onOpenChange = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingEntry(null);
        form.reset({ subjectId: subjects?.[0]?.id || 0, dayOfWeek: 0, startTime: "08:00", endTime: "09:00" });
      }, 200);
    } else if (subjects && subjects.length > 0 && form.getValues().subjectId === 0) {
      form.setValue("subjectId", subjects[0].id);
    }
  };

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    form.reset({
      subjectId: entry.subjectId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setIsAddOpen(true);
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({ entryId: editingEntry.id, data });
        toast({ title: "تم التعديل", description: "تم تحديث الحصة بنجاح." });
      } else {
        await createEntry.mutateAsync({ data });
        toast({ title: "تمت الإضافة", description: "تمت إضافة الحصة للجدول." });
      }
      queryClient.invalidateQueries({ queryKey: getListScheduleEntriesQueryKey() });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ الحصة." });
    }
  };

  const confirmDelete = async () => {
    if (!deletingEntryId) return;
    try {
      await deleteEntry.mutateAsync({ entryId: deletingEntryId });
      queryClient.invalidateQueries({ queryKey: getListScheduleEntriesQueryKey() });
      toast({ title: "تم الحذف", description: "تم حذف الحصة بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف." });
    } finally {
      setDeletingEntryId(null);
    }
  };

  // Group schedule by day
  const scheduleByDay = DAYS.map(day => ({
    ...day,
    entries: (schedule || [])
      .filter(e => e.dayOfWeek === day.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  })).filter(day => day.entries.length > 0 || day.id < 5); // Show Sun-Thu even if empty, hide empty Fri/Sat

  if (scheduleLoading || subjectsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">الجدول الأسبوعي</h1>
          <p className="text-muted-foreground">نظم وقتك وتتبع حصصك اليومية.</p>
        </div>
        <Button onClick={() => onOpenChange(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> إضافة حصة
        </Button>
      </header>

      {subjects?.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card border-dashed">
          <CalendarIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-medium">أضف مواد أولاً</h3>
          <p className="text-muted-foreground mb-4">يجب إضافة مادة دراسية واحدة على الأقل لإنشاء جدول.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-7 gap-4 items-start">
          {scheduleByDay.map(day => (
            <div key={day.id} className="space-y-3">
              <div className="bg-muted/50 rounded-lg py-2 px-3 text-center font-bold text-sm sticky top-0 backdrop-blur-md z-10 border">
                {day.label}
              </div>
              
              <div className="space-y-3 min-h-[100px]">
                {day.entries.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground/50 border border-dashed rounded-xl">
                    لا يوجد حصص
                  </div>
                ) : (
                  day.entries.map(entry => (
                    <Card key={entry.id} className="overflow-hidden hover-elevate transition-all border-l-4 group" style={{ borderLeftColor: entry.subjectColor }}>
                      <CardContent className="p-3 relative">
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted focus:outline-none">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(entry)} className="cursor-pointer gap-2 text-xs">
                                <Pencil className="w-3 h-3" /> تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeletingEntryId(entry.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 gap-2 text-xs">
                                <Trash2 className="w-3 h-3" /> حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="font-bold text-sm mb-2 pt-1">{entry.subjectName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          <span className="dir-ltr inline-block">{entry.startTime} - {entry.endTime}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "تعديل حصة" : "إضافة حصة جديدة"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="subjectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>المادة</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value ? field.value.toString() : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {subjects?.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }}></span>
                            {sub.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                <FormItem>
                  <FormLabel>اليوم</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value.toString()}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day.id} value={day.id.toString()}>{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وقت البداية</FormLabel>
                    <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وقت النهاية</FormLabel>
                    <FormControl><Input type="time" {...field} className="font-mono text-left dir-ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createEntry.isPending || updateEntry.isPending} className="w-full">
                  {(createEntry.isPending || updateEntry.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingEntry ? "حفظ التعديلات" : "إضافة للجدول"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(o) => !o && setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحصة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه الحصة من الجدول الأسبوعي؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
