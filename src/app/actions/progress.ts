"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CardState } from "@prisma/client";

export type ReviewGrade = "Again" | "Hard" | "Good" | "Easy";

interface SaveReviewInput {
  track: {
    id: string;
    slug: string;
    title: string;
    description: string;
  };
  milestone: {
    id: string;
    title: string;
    orderIndex: number;
  };
  card: {
    id: string;
    prompt: string;
    answer: string;
    explanation: string;
    options: string[];
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    dueDate: number;
    lastReviewDate: number;
  };
  grade: ReviewGrade;
}

const XP_REWARDS: Record<ReviewGrade, number> = {
  Again: 0,
  Hard: 5,
  Good: 10,
  Easy: 15,
};

export async function getUserProgress() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.email?.split("@")[0] ||
    "Estudante";

  // Ensure the authenticated user exists in PostgreSQL
  const dbUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: {
      id: authUser.id,
      email: authUser.email!,
      name: displayName,
      xp: 0,
      streak: 1,
      hearts: 5,
    },
    include: {
      cardProgress: true,
    },
  });

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      xp: dbUser.xp,
      streak: dbUser.streak,
      hearts: dbUser.hearts,
    },
    cardProgress: dbUser.cardProgress.map((cp) => ({
      flashcardId: cp.flashcardId,
      stability: cp.stability,
      difficulty: cp.difficulty,
      reps: cp.reps,
      lapses: cp.lapses,
      dueDate: cp.due.getTime(),
      lastReviewDate: cp.lastReview ? cp.lastReview.getTime() : undefined,
    })),
  };
}

export async function saveCardReview(input: SaveReviewInput) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Unauthorized");
  }

  const { track, milestone, card, grade } = input;

  // 1. Ensure Subject, MilestoneNode, and Flashcard exist with matching IDs to prevent FK errors
  const dbSubject = await prisma.subject.upsert({
    where: { slug: track.slug },
    update: {},
    create: {
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      iconName: "BookOpen",
      colorTheme: "emerald",
    },
  });

  await prisma.milestoneNode.upsert({
    where: { id: milestone.id },
    update: {},
    create: {
      id: milestone.id,
      subjectId: dbSubject.id,
      title: milestone.title,
      orderIndex: milestone.orderIndex,
      xpReward: 30,
    },
  });

  await prisma.flashcard.upsert({
    where: { id: card.id },
    update: {},
    create: {
      id: card.id,
      milestoneNodeId: milestone.id,
      prompt: card.prompt,
      answer: card.answer,
      explanation: card.explanation,
      options: card.options,
    },
  });

  // 2. Save or update the user's FSRS parameters for this card
  const nextState: CardState =
    grade === "Again" ? CardState.Relearning : CardState.Review;

  await prisma.userCardProgress.upsert({
    where: {
      userId_flashcardId: {
        userId: authUser.id,
        flashcardId: card.id,
      },
    },
    update: {
      due: new Date(card.dueDate),
      stability: card.stability,
      difficulty: card.difficulty,
      reps: card.reps,
      lapses: card.lapses,
      state: nextState,
      lastReview: new Date(card.lastReviewDate),
    },
    create: {
      userId: authUser.id,
      flashcardId: card.id,
      due: new Date(card.dueDate),
      stability: card.stability,
      difficulty: card.difficulty,
      reps: card.reps,
      lapses: card.lapses,
      state: nextState,
      lastReview: new Date(card.lastReviewDate),
    },
  });

  // 3. Update User XP, Hearts, and lastStudyDate
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
  });

  const xpEarned = XP_REWARDS[grade];
  const nextHearts =
    grade === "Again"
      ? Math.max(0, currentUser.hearts - 1)
      : currentUser.hearts;

  const updatedUser = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      xp: { increment: xpEarned },
      hearts: nextHearts,
      lastStudyDate: new Date(),
    },
  });

  return {
    xp: updatedUser.xp,
    hearts: updatedUser.hearts,
    streak: updatedUser.streak,
  };
}

export async function incrementUserStreak() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const updatedUser = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      streak: { increment: 1 },
      lastStudyDate: new Date(),
    },
  });

  return updatedUser.streak;
}