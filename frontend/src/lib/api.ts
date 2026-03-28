import type {
  Achievement,
  AnswerResponse,
  BookmarkedQuiz,
  Category,
  CompleteResponse,
  DailySet,
  LeaderboardEntry,
  LearningPath,
  Lesson,
  OnboardingQuiz,
  Progress,
  QuizAdmin,
  ReviewAnswerResponse,
  ReviewCompleteResponse,
  ReviewSession,
  SessionHistoryItem,
  TokenResponse,
  User,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("padme_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/auth/me"),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categoriesApi = {
  list: () => request<Category[]>("/categories"),
  get: (id: string) => request<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------
export const lessonsApi = {
  list: (categoryId?: string) =>
    request<Lesson[]>(`/lessons${categoryId ? `?category_id=${categoryId}` : ""}`),
  get: (id: string) => request<Lesson>(`/lessons/${id}`),
  create: (data: Partial<Lesson>) =>
    request<Lesson>("/lessons", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lesson>) =>
    request<Lesson>(`/lessons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/lessons/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------
export const quizzesApi = {
  listForLesson: (lessonId: string) =>
    request<QuizAdmin[]>(`/quizzes/by-lesson/${lessonId}`),
  get: (id: string) => request<QuizAdmin>(`/quizzes/${id}`),
  create: (data: unknown) =>
    request<QuizAdmin>("/quizzes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) =>
    request<QuizAdmin>(`/quizzes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/quizzes/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Users (admin + self-service)
// ---------------------------------------------------------------------------
export const usersApi = {
  list: () => request<User[]>("/users"),
  create: (data: { email: string; password: string; name?: string; role?: string }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; role: string; is_active: boolean }>) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
  useStreakFreeze: () =>
    request<User>("/users/me/use-streak-freeze", { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Daily set
// ---------------------------------------------------------------------------
export const dailySetApi = {
  getToday: () => request<DailySet>("/daily-set"),
  submitAnswer: (setId: string, quizId: string, answer: string) =>
    request<AnswerResponse>(`/daily-set/${setId}/answer`, {
      method: "POST",
      body: JSON.stringify({ quiz_id: quizId, answer }),
    }),
  complete: (setId: string) =>
    request<CompleteResponse>(`/daily-set/${setId}/complete`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------
export const progressApi = {
  get: () => request<Progress>("/progress"),
};

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------
export const reviewApi = {
  start: () => request<ReviewSession>("/review/start", { method: "POST" }),
  get: (sessionId: string) => request<ReviewSession>(`/review/${sessionId}`),
  submitAnswer: (sessionId: string, quizId: string, answer: string) =>
    request<ReviewAnswerResponse>(`/review/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ quiz_id: quizId, answer }),
    }),
  complete: (sessionId: string) =>
    request<ReviewCompleteResponse>(`/review/${sessionId}/complete`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export const achievementsApi = {
  list: () => request<Achievement[]>("/achievements"),
};

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
export const leaderboardApi = {
  get: () => request<LeaderboardEntry[]>("/leaderboard"),
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export const historyApi = {
  get: () => request<SessionHistoryItem[]>("/history"),
};

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export const bookmarksApi = {
  list: () => request<BookmarkedQuiz[]>("/bookmarks"),
  add: (quizId: string) =>
    request<BookmarkedQuiz>("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ quiz_id: quizId }),
    }),
  remove: (quizId: string) => request<void>(`/bookmarks/${quizId}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Learning Paths
// ---------------------------------------------------------------------------
export const pathsApi = {
  list: () => request<LearningPath[]>("/paths"),
};

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------
export const onboardingApi = {
  getQuiz: () => request<OnboardingQuiz[]>("/onboarding/quiz"),
  complete: () => request<void>("/onboarding/complete", { method: "POST" }),
};
