/**
 * Tests for the API client (lib/api.ts).
 * Uses vi.stubGlobal to mock fetch.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi, categoriesApi, dailySetApi, progressApi } from "@/lib/api";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
  localStorage.clear();
});

function mockResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    statusText: status === 200 ? "OK" : "Error",
  });
}

function mockErrorResponse(detail: string, status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail }),
    statusText: "Error",
  });
}

describe("authApi", () => {
  it("login sends POST to /auth/login with credentials", async () => {
    const fakeResponse = {
      access_token: "tok123",
      token_type: "bearer",
      user: { id: "u1", email: "user@test.com", name: "Test", role: "user", xp: 0, streak: 0, longest_streak: 0, last_active_date: null },
    };
    mockResponse(fakeResponse);

    const result = await authApi.login("user@test.com", "password123");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ email: "user@test.com", password: "password123" });
    expect(result.access_token).toBe("tok123");
  });

  it("login throws on 401", async () => {
    mockErrorResponse("Invalid email or password", 401);
    await expect(authApi.login("bad@test.com", "wrong")).rejects.toThrow("Invalid email or password");
  });

  it("me sends GET to /auth/me with auth header when token is present", async () => {
    localStorage.setItem("padme_token", "my-token");
    mockResponse({ id: "u1", email: "user@test.com", name: null, role: "user", xp: 0, streak: 0, longest_streak: 0, last_active_date: null });

    await authApi.me();

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/me");
    expect(opts.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("me omits Authorization header when no token in localStorage", async () => {
    mockResponse({ id: "u1", email: "user@test.com", name: null, role: "user", xp: 0, streak: 0, longest_streak: 0, last_active_date: null });

    await authApi.me();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBeUndefined();
  });
});

describe("categoriesApi", () => {
  it("list sends GET to /categories", async () => {
    mockResponse([]);
    await categoriesApi.list();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/categories");
    expect(opts.method).toBeUndefined();
  });

  it("get sends GET to /categories/:id", async () => {
    mockResponse({ id: "cat-1", name: "Delta Lake", description: null, icon: null, color: null, order: 0, lesson_count: 3 });
    await categoriesApi.get("cat-1");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/categories/cat-1");
  });

  it("create sends POST to /categories", async () => {
    mockResponse({ id: "cat-2", name: "MLflow", description: null, icon: null, color: null, order: 0, lesson_count: 0 }, 201);
    await categoriesApi.create({ name: "MLflow" });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/categories");
    expect(opts.method).toBe("POST");
  });

  it("delete sends DELETE to /categories/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined });
    await categoriesApi.delete("cat-1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/categories/cat-1");
    expect(opts.method).toBe("DELETE");
  });
});

describe("dailySetApi", () => {
  it("getToday sends GET to /daily-set", async () => {
    mockResponse({ id: "ds-1", date: "2026-03-28", is_completed: false, xp_earned: 0, quizzes: [] });
    await dailySetApi.getToday();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/daily-set");
  });

  it("submitAnswer sends POST with quiz_id and answer", async () => {
    mockResponse({ is_correct: true, explanation: null, xp_earned: 10, correct_option_id: "opt-1" });
    await dailySetApi.submitAnswer("set-1", "quiz-1", "opt-1");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/daily-set/set-1/answer");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.quiz_id).toBe("quiz-1");
    expect(body.answer).toBe("opt-1");
  });

  it("complete sends POST to /daily-set/:id/complete", async () => {
    mockResponse({ xp_earned: 70, new_total_xp: 170, streak: 3, longest_streak: 5, perfect_set: true, correct_count: 5, total_count: 5 });
    await dailySetApi.complete("set-1");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/daily-set/set-1/complete");
    expect(opts.method).toBe("POST");
  });
});

describe("progressApi", () => {
  it("get sends GET to /progress", async () => {
    mockResponse({ xp: 100, streak: 3, longest_streak: 5, last_active_date: null, categories: [], weekly_activity: [] });
    await progressApi.get();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/progress");
  });
});

describe("error handling", () => {
  it("throws with detail message from API error response", async () => {
    mockErrorResponse("Quiz not in this daily set", 400);
    await expect(dailySetApi.submitAnswer("set-1", "bad-quiz", "opt-1")).rejects.toThrow("Quiz not in this daily set");
  });

  it("throws with statusText when json parse fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error("not json"); },
      statusText: "Internal Server Error",
    });
    await expect(authApi.me()).rejects.toThrow("Internal Server Error");
  });

  it("includes Authorization header from localStorage on any authenticated request", async () => {
    localStorage.setItem("padme_token", "secret-token");
    mockResponse({ xp: 0, streak: 0, longest_streak: 0, last_active_date: null, categories: [], weekly_activity: [] });

    await progressApi.get();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Bearer secret-token");
  });
});
