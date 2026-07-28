import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, usersTable, subjectsTable, lessonsTable, examsTable } from "@workspace/db";
import { computeSuggestion, type LessonCandidate, type ExamInfo } from "../lib/decisionEngine";

const router: IRouter = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0]!;

  // Run all independent queries in parallel
  const [userRows, subjects, allLessonsRows, allExams] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, 1)),
    db.select().from(subjectsTable).where(eq(subjectsTable.userId, 1)),
    db
      .select({
        // lesson fields
        id:             lessonsTable.id,
        name:           lessonsTable.name,
        isCompleted:    lessonsTable.isCompleted,
        isReviewed:     lessonsTable.isReviewed,
        lastReviewedAt: lessonsTable.lastReviewedAt,
        masteryLevel:   lessonsTable.masteryLevel,
        // subject fields
        subjectId:         subjectsTable.id,
        subjectName:       subjectsTable.name,
        subjectColor:      subjectsTable.color,
        subjectDifficulty: subjectsTable.difficulty,
      })
      .from(lessonsTable)
      .innerJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
      .where(eq(subjectsTable.userId, 1)),
    db
      .select()
      .from(examsTable)
      .where(eq(examsTable.userId, 1)),
  ]);

  const user = userRows[0];

  // Stats
  const totalLessons     = allLessonsRows.length;
  const completedLessons = allLessonsRows.filter((r) => r.isCompleted).length;
  const overallProgress  = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  const upcomingExams = allExams.filter(
    (e) => !e.isCompleted && e.examDate >= today,
  ).length;

  const lessonsNeedingReview = allLessonsRows.filter(
    (r) => r.isCompleted && !r.isReviewed,
  ).length;

  // Decision engine — only feed upcoming, incomplete exams
  const candidates: LessonCandidate[] = allLessonsRows.map((r) => ({
    lessonId:          r.id,
    lessonName:        r.name,
    subjectId:         r.subjectId,
    subjectName:       r.subjectName,
    subjectColor:      r.subjectColor,
    subjectDifficulty: r.subjectDifficulty,
    masteryLevel:      r.masteryLevel,
    isCompleted:       r.isCompleted,
    isReviewed:        r.isReviewed,
    lastReviewedAt:    r.lastReviewedAt,
  }));

  const examInfos: ExamInfo[] = allExams
    .filter((e) => !e.isCompleted && e.examDate >= today)
    .map((e) => ({ subjectId: e.subjectId, examDate: e.examDate }));

  const suggestion = computeSuggestion(candidates, examInfos);

  // Last earned badge (milestone-based, simplified for MVP)
  let lastAchievement: Record<string, unknown> | undefined;
  if (completedLessons >= 50) {
    lastAchievement = {
      id: "fifty_lessons", name: "خمسون درساً",
      description: "أكملت 50 درساً", isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  } else if (completedLessons >= 10) {
    lastAchievement = {
      id: "ten_lessons", name: "عشرة دروس",
      description: "أكملت 10 دروس", isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  } else if (completedLessons >= 1) {
    lastAchievement = {
      id: "first_lesson", name: "الدرس الأول",
      description: "أكملت أول درس لك", isEarned: true,
      earnedAt: new Date().toISOString(),
    };
  }

  const response: Record<string, unknown> = {
    welcomeMessage:      user ? `مرحباً بك، ${user.name}!` : "مرحباً بك في AIX",
    annualGoal:          user?.annualGoal ?? "لم يُحدد هدف بعد",
    targetGrade:         user?.targetGrade ?? 90,
    overallProgress,
    totalSubjects:       subjects.length,
    upcomingExams,
    lessonsNeedingReview,
  };

  if (suggestion)       response.suggestedLesson  = suggestion;
  if (lastAchievement)  response.lastAchievement  = lastAchievement;

  res.json(response);
});

export default router;
