import { Router, type IRouter } from "express";
import { eq, avg, count, and } from "drizzle-orm";
import { db, subjectsTable, lessonsTable } from "@workspace/db";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  GetSubjectParams,
  UpdateSubjectParams,
  DeleteSubjectParams,
  GetSubjectProgressParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /subjects
router.get("/subjects", async (req, res): Promise<void> => {
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.userId, 1))
    .orderBy(subjectsTable.createdAt);

  res.json(
    subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      difficulty: s.difficulty,
      teacher: s.teacher,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

// POST /subjects
router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db
    .insert(subjectsTable)
    .values({
      userId: 1,
      name: parsed.data.name,
      color: parsed.data.color,
      difficulty: parsed.data.difficulty,
      teacher: parsed.data.teacher ?? null,
    })
    .returning();

  res.status(201).json({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    teacher: subject.teacher,
    createdAt: subject.createdAt.toISOString(),
  });
});

// GET /subjects/:subjectId
router.get("/subjects/:subjectId", async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, params.data.subjectId), eq(subjectsTable.userId, 1)));

  if (!subject) {
    res.status(404).json({ error: "المادة غير موجودة" });
    return;
  }

  res.json({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    teacher: subject.teacher,
    createdAt: subject.createdAt.toISOString(),
  });
});

// PATCH /subjects/:subjectId
router.patch("/subjects/:subjectId", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.difficulty !== undefined) updateData.difficulty = parsed.data.difficulty;
  if ("teacher" in parsed.data) updateData.teacher = parsed.data.teacher ?? null;

  const [subject] = await db
    .update(subjectsTable)
    .set(updateData)
    .where(and(eq(subjectsTable.id, params.data.subjectId), eq(subjectsTable.userId, 1)))
    .returning();

  if (!subject) {
    res.status(404).json({ error: "المادة غير موجودة" });
    return;
  }

  res.json({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    teacher: subject.teacher,
    createdAt: subject.createdAt.toISOString(),
  });
});

// DELETE /subjects/:subjectId
router.delete("/subjects/:subjectId", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(subjectsTable)
    .where(and(eq(subjectsTable.id, params.data.subjectId), eq(subjectsTable.userId, 1)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "المادة غير موجودة" });
    return;
  }

  res.json({ success: true });
});

// GET /subjects/:subjectId/progress
router.get("/subjects/:subjectId/progress", async (req, res): Promise<void> => {
  const params = GetSubjectProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.subjectId, params.data.subjectId));

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => l.isCompleted).length;
  const reviewedLessons = lessons.filter((l) => l.isReviewed).length;
  const averageMastery =
    totalLessons > 0
      ? Math.round(lessons.reduce((acc, l) => acc + l.masteryLevel, 0) / totalLessons)
      : 0;
  const completionRate =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    subjectId: params.data.subjectId,
    totalLessons,
    completedLessons,
    reviewedLessons,
    averageMastery,
    completionRate,
  });
});

export default router;
