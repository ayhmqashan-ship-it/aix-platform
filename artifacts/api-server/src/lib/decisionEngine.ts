/**
 * AIX Decision Engine — Local Algorithm (MVP)
 *
 * Analyses subjects, lessons, and upcoming exams to recommend the
 * highest-priority lesson to study right now. No external AI is used.
 *
 * Scoring factors (max 100 pts):
 *   1. Days until next exam for the lesson's subject  — up to 40 pts
 *   2. Subject difficulty                             — up to 15 pts
 *   3. Lesson mastery level (lower = higher priority) — up to 25 pts
 *   4. Completion / review status                     — up to 20 pts
 *   5. Time since last review (if already reviewed)   — up to 10 pts
 *
 * NOTE: Factors 4 and 5 are mutually exclusive, so the absolute maximum
 * score is 40+15+25+20 = 100 pts, which is also the normalisation base.
 */

export interface LessonCandidate {
  lessonId: number;
  lessonName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  subjectDifficulty: string;
  masteryLevel: number;
  isCompleted: boolean;
  isReviewed: boolean;
  lastReviewedAt: Date | null;
}

/** Only pass UPCOMING (not completed, not past) exams to this engine. */
export interface ExamInfo {
  subjectId: number;
  examDate: string; // YYYY-MM-DD
}

export interface SuggestionResult {
  lessonId: number;
  lessonName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  reason: string;
  priorityLevel: "critical" | "high" | "medium" | "low";
  confidenceScore: number; // 0-100, normalised
}

/** Maximum achievable score (factors 4 and 5 are mutually exclusive). */
const MAX_SCORE = 100;

function difficultyPoints(difficulty: string): number {
  switch (difficulty) {
    case "hard":   return 15;
    case "medium": return 10;
    case "easy":   return 5;
    default:       return 10;
  }
}

function daysUntilDate(dateStr: string): number {
  const now  = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1_000 * 60 * 60 * 24)));
}

function daysSince(date: Date | null): number {
  if (!date) return 30; // treat "never reviewed" as 30 days ago
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1_000 * 60 * 60 * 24));
}

export function computeSuggestion(
  lessons: LessonCandidate[],
  upcomingExams: ExamInfo[], // caller must pre-filter to future, incomplete exams
): SuggestionResult | null {
  if (lessons.length === 0) return null;

  // Build subjectId → nearest upcoming exam (days away)
  const nearestExamDays = new Map<number, number>();
  for (const exam of upcomingExams) {
    const days = daysUntilDate(exam.examDate);
    const current = nearestExamDays.get(exam.subjectId);
    if (current === undefined || days < current) {
      nearestExamDays.set(exam.subjectId, days);
    }
  }

  // Score every lesson
  const scored = lessons.map((lesson) => {
    let score = 0;
    const reasonParts: string[] = [];

    // ── Factor 1: Exam proximity (0–40 pts) ──────────────────────────────
    const daysToExam = nearestExamDays.get(lesson.subjectId);
    if (daysToExam !== undefined) {
      if (daysToExam <= 1) {
        score += 40;
        reasonParts.push("الاختبار غداً أو اليوم!");
      } else if (daysToExam <= 3) {
        score += 35;
        reasonParts.push(`الاختبار بعد ${daysToExam} أيام`);
      } else if (daysToExam <= 7) {
        score += 25;
        reasonParts.push(`الاختبار خلال أسبوع (${daysToExam} أيام)`);
      } else if (daysToExam <= 14) {
        score += 15;
        reasonParts.push(`الاختبار خلال أسبوعين (${daysToExam} أيام)`);
      } else {
        score += 5;
      }
    }

    // ── Factor 2: Subject difficulty (5–15 pts) ───────────────────────────
    const diffPts = difficultyPoints(lesson.subjectDifficulty);
    score += diffPts;
    if (lesson.subjectDifficulty === "hard") {
      reasonParts.push("مادة صعبة تحتاج وقتاً أطول");
    }

    // ── Factor 3: Mastery (0–25 pts) — lower mastery → higher priority ───
    const masteryPts = ((100 - lesson.masteryLevel) / 100) * 25;
    score += masteryPts;
    if (lesson.masteryLevel < 40) {
      reasonParts.push("مستوى الإتقان منخفض");
    }

    // ── Factor 4: Completion / review status (0–20 pts) ──────────────────
    if (!lesson.isCompleted) {
      score += 20;
      reasonParts.push("الدرس لم يُكتمل بعد");
    } else if (!lesson.isReviewed) {
      score += 15;
      reasonParts.push("الدرس يحتاج إلى مراجعة");
    } else {
      // ── Factor 5: Time since last review (0–10 pts) ─────────────────
      const daysSinceReview = daysSince(lesson.lastReviewedAt);
      if (daysSinceReview > 7) {
        const reviewPts = Math.min(10, daysSinceReview / 2);
        score += reviewPts;
        reasonParts.push(`لم تُراجعه منذ ${daysSinceReview} يوماً`);
      }
    }

    return { lesson, score, reasonParts };
  });

  // Best lesson = highest score
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;

  // ── Priority level ────────────────────────────────────────────────────────
  let priorityLevel: SuggestionResult["priorityLevel"];
  if      (best.score >= 60) priorityLevel = "critical";
  else if (best.score >= 40) priorityLevel = "high";
  else if (best.score >= 20) priorityLevel = "medium";
  else                       priorityLevel = "low";

  // ── Confidence score: normalised 0–100 ───────────────────────────────────
  const confidenceScore = Math.min(100, Math.round((best.score / MAX_SCORE) * 100));

  // ── Human-readable reason ─────────────────────────────────────────────────
  const reason =
    best.reasonParts.length > 0
      ? best.reasonParts.slice(0, 2).join("، ")
      : "الأولوية بناءً على تحليل شامل لجميع المواد";

  return {
    lessonId:     best.lesson.lessonId,
    lessonName:   best.lesson.lessonName,
    subjectId:    best.lesson.subjectId,
    subjectName:  best.lesson.subjectName,
    subjectColor: best.lesson.subjectColor,
    reason,
    priorityLevel,
    confidenceScore,
  };
}
