import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, lessonsTable, subjectsTable, examsTable } from "@workspace/db";
import { computeSuggestion, type LessonCandidate, type ExamInfo } from "../lib/decisionEngine";

const router: IRouter = Router();

// GET /decision/suggest
router.get("/decision/suggest", async (req, res): Promise<void> => {
  // Load all lessons with their subject info
  const lessons = await db
    .select({
      lessonId:          lessonsTable.id,
      lessonName:        lessonsTable.name,
      subjectId:         subjectsTable.id,
      subjectName:       subjectsTable.name,
      subjectColor:      subjectsTable.color,
      subjectDifficulty: subjectsTable.difficulty,
      masteryLevel:      lessonsTable.masteryLevel,
      isCompleted:       lessonsTable.isCompleted,
      isReviewed:        lessonsTable.isReviewed,
      lastReviewedAt:    lessonsTable.lastReviewedAt,
    })
    .from(lessonsTable)
    .innerJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .where(eq(subjectsTable.userId, 1));

  if (lessons.length === 0) {
    res.status(204).end();
    return;
  }

  // Load UPCOMING exams only — past/completed exams must not influence scores
  const today = new Date().toISOString().split("T")[0]!;
  const exams = await db
    .select({ subjectId: examsTable.subjectId, examDate: examsTable.examDate })
    .from(examsTable)
    .where(
      and(
        eq(examsTable.userId, 1),
        eq(examsTable.isCompleted, false),
        gte(examsTable.examDate, today),
      ),
    );

  const candidates: LessonCandidate[] = lessons.map((l) => ({
    lessonId:          l.lessonId,
    lessonName:        l.lessonName,
    subjectId:         l.subjectId,
    subjectName:       l.subjectName,
    subjectColor:      l.subjectColor,
    subjectDifficulty: l.subjectDifficulty,
    masteryLevel:      l.masteryLevel,
    isCompleted:       l.isCompleted,
    isReviewed:        l.isReviewed,
    lastReviewedAt:    l.lastReviewedAt,
  }));

  const examInfos: ExamInfo[] = exams.map((e) => ({
    subjectId: e.subjectId,
    examDate:  e.examDate,
  }));

  const suggestion = computeSuggestion(candidates, examInfos);

  if (!suggestion) {
    res.status(204).end();
    return;
  }

  res.json(suggestion);
});

export default router;
