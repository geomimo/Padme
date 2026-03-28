import { create } from "zustand";
import type { ReviewAnswerResponse, ReviewQuizPublic } from "@/types";

interface ReviewAnswer {
  quizId: string;
  answer: string;
  isCorrect: boolean;
  explanation: string | null;
  detail: string | null;
  correctOptionId: string | null;
}

type SessionState = "idle" | "answering" | "feedback" | "complete";

interface ReviewSessionStore {
  sessionId: string | null;
  quizzes: ReviewQuizPublic[];
  currentIndex: number;
  answers: ReviewAnswer[];
  sessionState: SessionState;

  init: (sessionId: string, quizzes: ReviewQuizPublic[]) => void;
  recordAnswer: (quizId: string, answer: string, response: ReviewAnswerResponse) => void;
  advance: () => void;
  markComplete: () => void;
  reset: () => void;
}

export const useReviewSession = create<ReviewSessionStore>((set, get) => ({
  sessionId: null,
  quizzes: [],
  currentIndex: 0,
  answers: [],
  sessionState: "idle",

  init: (sessionId, quizzes) =>
    set({ sessionId, quizzes, currentIndex: 0, answers: [], sessionState: "answering" }),

  recordAnswer: (quizId, answer, response) =>
    set((s) => ({
      answers: [
        ...s.answers,
        {
          quizId,
          answer,
          isCorrect: response.is_correct,
          explanation: response.explanation,
          detail: response.detail,
          correctOptionId: response.correct_option_id,
        },
      ],
      sessionState: "feedback",
    })),

  advance: () =>
    set((s) => {
      const next = s.currentIndex + 1;
      if (next >= s.quizzes.length) {
        return { sessionState: "complete", currentIndex: next };
      }
      return { currentIndex: next, sessionState: "answering" };
    }),

  markComplete: () => set({ sessionState: "complete" }),

  reset: () =>
    set({
      sessionId: null,
      quizzes: [],
      currentIndex: 0,
      answers: [],
      sessionState: "idle",
    }),
}));
