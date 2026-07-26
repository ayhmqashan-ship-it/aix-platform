import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, usersTable, subjectsTable, lessonsTable, examsTable } from "@workspace/db";
import { computeSuggestion, type LessonCandidate, type ExamInfo } from "../lib/decisionEngine";

const router: IRouter = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, 1));

  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, 1));

  const allLessons = await db
    .select()
    .from(lessonsTable)
    .innerJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .where(eq(subjectsTable.userId, 1));

  const allExams = await db
    .select()
    .from(examsTable)
    .where(eq(examsTable.userId, 1));

  const today = new Date().toISOString().split("T")[0];
  const upcomingExams = allExams.filter((e) => !e.isCompleted && e.examDate >= today).length;
  const lessonsNeedingReview = allLessons.filter(
    (row) => row.lessons.isCompleted && !row.lessons.isReviewed
  ).length;

  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((row) => row.lessons.isCompleted).length;
  const overallProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Compute smart suggestion
  const candidates: LessonCandidate[] = allLessons.map((row) => ({
    lessonId: row.lessons.id,
    lessonName: row.lessons.name,
    subjectId: row.subjects.id,
    subjectName: row.subjects.name,
    subjectColor: row.subjects.color,
    subjectDifficulty: row.subjects.difficulty,
    masteryLevel: row.lessons.masteryLevel,
    isCompleted: row.lessons.isCompleted,
    isReviewed: row.lessons.isReviewed,
    lastReviewedAt: row.lessons.lastReviewedAt,
  }));

  const examInfos: ExamInfo[] = allExams.map((e) => ({
    subjectId: e.subjectId,
    examDate: e.examDate,
  }));

  const suggestion = computeSuggestion(candidates, examInfos);

  const welcomeMessage = user
    ? `مرحباً بك، ${user.name}!`
    : "مرحباً بك في AIX";

  const annualGoal = user?.annualGoal ?? "لم يُحدد هدف بعد";
  const targetGrade = user?.targetGrade ?? 90;

  // Last earned badge (simplified: check completed lessons milestone)
  let lastAchievement = undefined;
  if (completedLessons >= 50) {
    lastAchievement = {
      id: "fifty_lessons",
      name: "خمسون درساً",
      description: "أكملت 50 درساً",
      isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  } else if (completedLessons >= 10) {
    lastAchievement = {
      id: "ten_lessons",
      name: "عشرة دروس",
      description: "أكملت 10 دروس",
      isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  } else if (completedLessons >= 1) {
    lastAchievement = {
      id: "first_lesson",
      name: "الدرس الأول",
      description: "أكملت أول درس لك",
      isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  }

  const response: Record<string, unknown> = {
    welcomeMessage,
    annualGoal,
    targetGrade,
    overallProgress,
    totalSubjects: subjects.length,
    upcomingExams,
    lessonsNeedingReview,
  };

  if (suggestion) response.suggestedLesson = suggestion;
  if (lastAchievement) response.lastAchievement = lastAchievement;

  res.json(response);
});

export default router;
