import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonsTable, subjectsTable } from "@workspace/db";
import {
  CreateLessonParams,
  CreateLessonBody,
  UpdateLessonParams,
  UpdateLessonBody,
  DeleteLessonParams,
  ListLessonsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /subjects/:subjectId/lessons
router.get("/subjects/:subjectId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.subjectId, params.data.subjectId))
    .orderBy(lessonsTable.createdAt);

  res.json(
    lessons.map((l) => ({
      id: l.id,
      subjectId: l.subjectId,
      name: l.name,
      isCompleted: l.isCompleted,
      isReviewed: l.isReviewed,
      lastReviewedAt: l.lastReviewedAt ? l.lastReviewedAt.toISOString() : null,
      masteryLevel: l.masteryLevel,
      notes: l.notes,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

// POST /subjects/:subjectId/lessons
router.post("/subjects/:subjectId/lessons", async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      subjectId: params.data.subjectId,
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    id: lesson.id,
    subjectId: lesson.subjectId,
    name: lesson.name,
    isCompleted: lesson.isCompleted,
    isReviewed: lesson.isReviewed,
    lastReviewedAt: lesson.lastReviewedAt ? lesson.lastReviewedAt.toISOString() : null,
    masteryLevel: lesson.masteryLevel,
    notes: lesson.notes,
    createdAt: lesson.createdAt.toISOString(),
  });
});

// PATCH /lessons/:lessonId
router.patch("/lessons/:lessonId", async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.isCompleted !== undefined) updateData.isCompleted = parsed.data.isCompleted;
  if (parsed.data.isReviewed !== undefined) {
    updateData.isReviewed = parsed.data.isReviewed;
    if (parsed.data.isReviewed) {
      updateData.lastReviewedAt = new Date();
    }
  }
  if (parsed.data.masteryLevel !== undefined) updateData.masteryLevel = parsed.data.masteryLevel;
  if ("notes" in parsed.data) updateData.notes = parsed.data.notes ?? null;

  const [lesson] = await db
    .update(lessonsTable)
    .set(updateData)
    .where(eq(lessonsTable.id, params.data.lessonId))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "الدرس غير موجود" });
    return;
  }

  res.json({
    id: lesson.id,
    subjectId: lesson.subjectId,
    name: lesson.name,
    isCompleted: lesson.isCompleted,
    isReviewed: lesson.isReviewed,
    lastReviewedAt: lesson.lastReviewedAt ? lesson.lastReviewedAt.toISOString() : null,
    masteryLevel: lesson.masteryLevel,
    notes: lesson.notes,
    createdAt: lesson.createdAt.toISOString(),
  });
});

// DELETE /lessons/:lessonId
router.delete("/lessons/:lessonId", async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(lessonsTable)
    .where(eq(lessonsTable.id, params.data.lessonId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "الدرس غير موجود" });
    return;
  }

  res.json({ success: true });
});

export default router;
