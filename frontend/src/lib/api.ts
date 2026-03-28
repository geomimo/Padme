import type {
  AnswerResponse,
  Category,
  CompleteResponse,
  DailySet,
  Lesson,
  Progress,
  QuizAdmin,
  TestCompleteResponse,
  TestPlan,
  TestPlanDetail,
  TestSessionDetail,
  TestSessionHistory,
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
// Users (admin)
// ---------------------------------------------------------------------------
export const usersApi = {
  list: () => request<User[]>("/users"),
  create: (data: { email: string; password: string; name?: string; role?: string }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; role: string; is_active: boolean }>) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
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
// Test Plans (admin manages, user reads)
// ---------------------------------------------------------------------------
export const testPlansApi = {
  list: () => request<TestPlan[]>("/test-plans"),
  get: (id: string) => request<TestPlanDetail>(`/test-plans/${id}`),
  create: (data: {
    user_id: string;
    title: string;
    description?: string;
    status?: string;
    quiz_ids: string[];
  }) => request<TestPlanDetail>("/test-plans", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: { title?: string; description?: string; status?: string; quiz_ids?: string[] }
  ) => request<TestPlanDetail>(`/test-plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/test-plans/${id}`, { method: "DELETE" }),

  // Sessions
  startSession: (planId: string) =>
    request<TestSessionDetail>(`/test-plans/${planId}/sessions`, { method: "POST" }),
  listSessions: (planId: string) =>
    request<TestSessionHistory[]>(`/test-plans/${planId}/sessions`),
};

// ---------------------------------------------------------------------------
// Test Sessions
// ---------------------------------------------------------------------------
export const testSessionsApi = {
  get: (sessionId: string) => request<TestSessionDetail>(`/test-sessions/${sessionId}`),
  submitAnswer: (sessionId: string, quizId: string, answer: string) =>
    request<AnswerResponse>(`/test-sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ quiz_id: quizId, answer }),
    }),
  complete: (sessionId: string) =>
    request<TestCompleteResponse>(`/test-sessions/${sessionId}/complete`, { method: "POST" }),
};
