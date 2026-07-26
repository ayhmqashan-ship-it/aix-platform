import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, examsTable, subjectsTable } from "@workspace/db";
import {
  CreateExamBody,
  UpdateExamBody,
  UpdateExamParams,
  DeleteExamParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichExam(exam: typeof examsTable.$inferSelect) {
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, exam.subjectId));
  return {
    id: exam.id,
    subjectId: exam.subjectId,
    subjectName: subject?.name ?? "غير محدد",
    subjectColor: subject?.color ?? "#6366f1",
    examDate: exam.examDate,
    examTime: exam.examTime,
    targetGrade: exam.targetGrade,
    notes: exam.notes,
    isCompleted: exam.isCompleted,
    createdAt: exam.createdAt.toISOString(),
  };
}

// GET /exams
router.get("/exams", async (req, res): Promise<void> => {
  const exams = await db
    .select()
    .from(examsTable)
    .where(eq(examsTable.userId, 1))
    .orderBy(examsTable.examDate);

  const enriched = await Promise.all(exams.map(enrichExam));
  res.json(enriched);
});

// POST /exams
router.post("/exams", async (req, res): Promise<void> => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [exam] = await db
    .insert(examsTable)
    .values({
      userId: 1,
      subjectId: parsed.data.subjectId,
      examDate: parsed.data.examDate,
      examTime: parsed.data.examTime ?? null,
      targetGrade: parsed.data.targetGrade ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  const enriched = await enrichExam(exam);
  res.status(201).json(enriched);
});

// PATCH /exams/:examId
router.patch("/exams/:examId", async (req, res): Promise<void> => {
  const params = UpdateExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.subjectId !== undefined) updateData.subjectId = parsed.data.subjectId;
  if (parsed.data.examDate !== undefined) updateData.examDate = parsed.data.examDate;
  if ("examTime" in parsed.data) updateData.examTime = parsed.data.examTime ?? null;
  if ("targetGrade" in parsed.data) updateData.targetGrade = parsed.data.targetGrade ?? null;
  if ("notes" in parsed.data) updateData.notes = parsed.data.notes ?? null;
  if (parsed.data.isCompleted !== undefined) updateData.isCompleted = parsed.data.isCompleted;

  const [exam] = await db
    .update(examsTable)
    .set(updateData)
    .where(and(eq(examsTable.id, params.data.examId), eq(examsTable.userId, 1)))
    .returning();

  if (!exam) {
    res.status(404).json({ error: "الاختبار غير موجود" });
    return;
  }

  const enriched = await enrichExam(exam);
  res.json(enriched);
});

// DELETE /exams/:examId
router.delete("/exams/:examId", async (req, res): Promise<void> => {
  const params = DeleteExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(examsTable)
    .where(and(eq(examsTable.id, params.data.examId), eq(examsTable.userId, 1)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "الاختبار غير موجود" });
    return;
  }

  res.json({ success: true });
});

export default router;
