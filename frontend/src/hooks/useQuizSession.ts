import { create } from "zustand";
import type { AnswerResponse, CompleteResponse, QuizPublic } from "@/types";

interface QuizAnswer {
  quizId: string;
  answer: string;
  isCorrect: boolean;
  xpEarned: number;
  correctOptionId: string | null;
  explanation: string | null;
  detail: string | null;
}

type SessionState = "idle" | "answering" | "feedback" | "complete";

interface QuizSessionStore {
  dailySetId: string | null;
  quizzes: QuizPublic[];
  currentIndex: number;
  answers: QuizAnswer[];
  sessionState: SessionState;
  completionResult: CompleteResponse | null;

  init: (dailySetId: string, quizzes: QuizPublic[]) => void;
  recordAnswer: (quizId: string, answer: string, response: AnswerResponse) => void;
  advance: () => void;
  setComplete: (result: CompleteResponse) => void;
  reset: () => void;
}

export const useQuizSession = create<QuizSessionStore>((set, get) => ({
  dailySetId: null,
  quizzes: [],
  currentIndex: 0,
  answers: [],
  sessionState: "idle",
  completionResult: null,

  init: (dailySetId, quizzes) =>
    set({ dailySetId, quizzes, currentIndex: 0, answers: [], sessionState: "answering", completionResult: null }),

  recordAnswer: (quizId, answer, response) =>
    set((s) => ({
      answers: [
        ...s.answers,
        {
          quizId,
          answer,
          isCorrect: response.is_correct,
          xpEarned: response.xp_earned,
          correctOptionId: response.correct_option_id,
          explanation: response.explanation,
          detail: response.detail,
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

  setComplete: (result) => set({ completionResult: result }),

  reset: () =>
    set({
      dailySetId: null,
      quizzes: [],
      currentIndex: 0,
      answers: [],
      sessionState: "idle",
      completionResult: null,
    }),
}));
