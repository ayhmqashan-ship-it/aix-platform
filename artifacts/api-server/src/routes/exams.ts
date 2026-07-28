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

/** Shared select shape — reused across GET list and single-record responses. */
const examWithSubjectSelect = {
  id:           examsTable.id,
  subjectId:    examsTable.subjectId,
  examDate:     examsTable.examDate,
  examTime:     examsTable.examTime,
  targetGrade:  examsTable.targetGrade,
  notes:        examsTable.notes,
  isCompleted:  examsTable.isCompleted,
  createdAt:    examsTable.createdAt,
  subjectName:  subjectsTable.name,
  subjectColor: subjectsTable.color,
} as const;

function formatExam(row: {
  id: number;
  subjectId: number;
  examDate: string;
  examTime: string | null;
  targetGrade: number | null;
  notes: string | null;
  isCompleted: boolean;
  createdAt: Date;
  subjectName: string | null;
  subjectColor: string | null;
}) {
  return {
    id:           row.id,
    subjectId:    row.subjectId,
    subjectName:  row.subjectName  ?? "غير محدد",
    subjectColor: row.subjectColor ?? "#6366f1",
    examDate:     row.examDate,
    examTime:     row.examTime,
    targetGrade:  row.targetGrade,
    notes:        row.notes,
    isCompleted:  row.isCompleted,
    createdAt:    row.createdAt.toISOString(),
  };
}

// GET /exams — single JOIN query, no N+1
router.get("/exams", async (req, res): Promise<void> => {
  const exams = await db
    .select(examWithSubjectSelect)
    .from(examsTable)
    .leftJoin(subjectsTable, eq(examsTable.subjectId, subjectsTable.id))
    .where(eq(examsTable.userId, 1))
    .orderBy(examsTable.examDate);

  res.json(exams.map(formatExam));
});

// POST /exams
router.post("/exams", async (req, res): Promise<void> => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inserted] = await db
    .insert(examsTable)
    .values({
      userId:      1,
      subjectId:   parsed.data.subjectId,
      examDate:    parsed.data.examDate,
      examTime:    parsed.data.examTime    ?? null,
      targetGrade: parsed.data.targetGrade ?? null,
      notes:       parsed.data.notes       ?? null,
    })
    .returning();

  // Fetch with JOIN to get subject info in one query
  const [row] = await db
    .select(examWithSubjectSelect)
    .from(examsTable)
    .leftJoin(subjectsTable, eq(examsTable.subjectId, subjectsTable.id))
    .where(eq(examsTable.id, inserted!.id));

  res.status(201).json(formatExam(row!));
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
  if (parsed.data.subjectId  !== undefined) updateData.subjectId  = parsed.data.subjectId;
  if (parsed.data.examDate   !== undefined) updateData.examDate   = parsed.data.examDate;
  if ("examTime"    in parsed.data) updateData.examTime    = parsed.data.examTime    ?? null;
  if ("targetGrade" in parsed.data) updateData.targetGrade = parsed.data.targetGrade ?? null;
  if ("notes"       in parsed.data) updateData.notes       = parsed.data.notes       ?? null;
  if (parsed.data.isCompleted !== undefined) updateData.isCompleted = parsed.data.isCompleted;

  const [updated] = await db
    .update(examsTable)
    .set(updateData)
    .where(and(eq(examsTable.id, params.data.examId), eq(examsTable.userId, 1)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "الاختبار غير موجود" });
    return;
  }

  const [row] = await db
    .select(examWithSubjectSelect)
    .from(examsTable)
    .leftJoin(subjectsTable, eq(examsTable.subjectId, subjectsTable.id))
    .where(eq(examsTable.id, updated.id));

  res.json(formatExam(row!));
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
