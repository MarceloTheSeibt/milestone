// src/lib/fsrs-engine.ts

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  Card as FSRSCard,
} from "ts-fsrs";
import { CardState, UserCardProgress } from "@prisma/client";

// Initialize FSRS with FSRS4Anki default parameters and fuzzing enabled
const params = generatorParameters({
  enable_fuzz: true,
  request_retention: 0.9, // 90% target retention rate for higher-ed mastery
  maximum_interval: 365,
});

const scheduler = fsrs(params);

export type ReviewGrade = "Again" | "Hard" | "Good" | "Easy";

const ratingMap: Record<ReviewGrade, Rating> = {
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
};

const stateToPrismaMap: Record<State, CardState> = {
  [State.New]: CardState.New,
  [State.Learning]: CardState.Learning,
  [State.Review]: CardState.Review,
  [State.Relearning]: CardState.Relearning,
};

const prismaToStateMap: Record<CardState, State> = {
  [CardState.New]: State.New,
  [CardState.Learning]: State.Learning,
  [CardState.Review]: State.Review,
  [CardState.Relearning]: State.Relearning,
};

export function mapPrismaToFSRSCard(progress?: UserCardProgress | null): FSRSCard {
  if (!progress) {
    return createEmptyCard(new Date());
  }

  return {
    due: progress.due,
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsedDays,
    scheduled_days: progress.scheduledDays,
    learning_steps: 0,
    reps: progress.reps,
    lapses: progress.lapses,
    state: prismaToStateMap[progress.state],
    last_review: progress.lastReview ?? undefined,
  };
}

export function scheduleNextReview(
  existingProgress: UserCardProgress | null,
  grade: ReviewGrade,
  now: Date = new Date()
) {
  const card = mapPrismaToFSRSCard(existingProgress);
  const recordLog = scheduler.repeat(card, now);
  const selectedRating = ratingMap[grade];
  const updatedCard = recordLog[selectedRating].card;

  return {
    due: updatedCard.due,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsedDays: updatedCard.elapsed_days,
    scheduledDays: updatedCard.scheduled_days,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: stateToPrismaMap[updatedCard.state],
    lastReview: updatedCard.last_review ?? now,
  };
}

export function getPreviewIntervals(
  existingProgress: UserCardProgress | null,
  now: Date = new Date()
): Record<ReviewGrade, string> {
  const card = mapPrismaToFSRSCard(existingProgress);
  const recordLog = scheduler.repeat(card, now);

  const formatInterval = (due: Date) => {
    const diffMinutes = Math.round((due.getTime() - now.getTime()) / 60000);
    if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d`;
  };

  return {
    Again: formatInterval(recordLog[Rating.Again].card.due),
    Hard: formatInterval(recordLog[Rating.Hard].card.due),
    Good: formatInterval(recordLog[Rating.Good].card.due),
    Easy: formatInterval(recordLog[Rating.Easy].card.due),
  };
}