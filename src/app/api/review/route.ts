// src/app/api/review/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleNextReview, ReviewGrade } from "@/lib/fsrs-engine";

const XP_REWARDS: Record<ReviewGrade, number> = {
  Again: 0,
  Hard: 5,
  Good: 10,
  Easy: 15,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, flashcardId, grade } = body as {
      userId: string;
      flashcardId: string;
      grade: ReviewGrade;
    };

    const existingProgress = await prisma.userCardProgress.findUnique({
      where: {
        userId_flashcardId: { userId, flashcardId },
      },
    });

    const now = new Date();
    const nextFSRSData = scheduleNextReview(existingProgress, grade, now);

    // Save updated FSRS parameters in PostgreSQL
    const updatedProgress = await prisma.userCardProgress.upsert({
      where: {
        userId_flashcardId: { userId, flashcardId },
      },
      update: nextFSRSData,
      create: {
        userId,
        flashcardId,
        ...nextFSRSData,
      },
    });

    // Update User Gamification Stats (XP, Hearts, Streak)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const xpEarned = XP_REWARDS[grade];
    const heartDelta = grade === "Again" ? -1 : 0;
    const nextHearts = Math.max(0, user.hearts + heartDelta);

    // Calculate daily streak
    let nextStreak = user.streak;
    const lastStudy = user.lastStudyDate;
    if (!lastStudy) {
      nextStreak = 1;
    } else {
      const diffHours = (now.getTime() - lastStudy.getTime()) / (1000 * 3600);
      if (diffHours >= 20 && diffHours <= 48) {
        nextStreak += 1;
      } else if (diffHours > 48) {
        nextStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpEarned },
        hearts: nextHearts,
        streak: nextStreak,
        lastStudyDate: now,
      },
    });

    return NextResponse.json({
      progress: updatedProgress,
      userStats: {
        xp: updatedUser.xp,
        hearts: updatedUser.hearts,
        streak: updatedUser.streak,
        xpEarned,
      },
    });
  } catch (error) {
    console.error("Error processing FSRS review:", error);
    return NextResponse.json(
      { error: "Não foi possível processar a revisão do cartão." },
      { status: 500 },
    );
  }
}
