/**
 * Tests for the AuthContext and AuthProvider.
 * Covers: initial loading from localStorage, login, logout.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const mockAuthApi = vi.mocked(apiModule.authApi);

const FAKE_USER = {
  id: "user-1",
  email: "user@test.com",
  name: "Test User",
  role: "user" as const,
  xp: 50,
  streak: 3,
  longest_streak: 7,
  last_active_date: "2026-03-27",
};

const FAKE_TOKEN = "fake-jwt-token";

function TestConsumer() {
  const { user, token, loading, logout } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  return (
    <div>
      <span data-testid="email">{user.email}</span>
      <span data-testid="token">{token}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function LoginConsumer() {
  const { login, user } = useAuth();
  return (
    <div>
      <button onClick={() => login("user@test.com", "password123")}>Login</button>
      {user && <span data-testid="logged-in">{user.email}</span>}
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider — initial state", () => {
  it("starts as not logged in when localStorage is empty", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Not logged in")).toBeInTheDocument();
    });
  });

  it("restores user from localStorage on mount", async () => {
    localStorage.setItem("padme_token", FAKE_TOKEN);
    localStorage.setItem("padme_user", JSON.stringify(FAKE_USER));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("email")).toHaveTextContent("user@test.com");
      expect(screen.getByTestId("token")).toHaveTextContent(FAKE_TOKEN);
    });
  });

  it("shows loading initially then resolves", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // After mount, should not remain in loading state
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});

describe("AuthProvider — login", () => {
  it("calls authApi.login and stores token and user", async () => {
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: FAKE_TOKEN,
      token_type: "bearer",
      user: FAKE_USER,
    });

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("logged-in")).toHaveTextContent("user@test.com");
    });

    expect(localStorage.getItem("padme_token")).toBe(FAKE_TOKEN);
    expect(JSON.parse(localStorage.getItem("padme_user")!)).toEqual(FAKE_USER);
  });

  it("passes email and password to authApi.login", async () => {
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: FAKE_TOKEN,
      token_type: "bearer",
      user: FAKE_USER,
    });

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Login").click();
    });

    expect(mockAuthApi.login).toHaveBeenCalledWith("user@test.com", "password123");
  });
});

describe("AuthProvider — logout", () => {
  it("clears user, token, and localStorage on logout", async () => {
    localStorage.setItem("padme_token", FAKE_TOKEN);
    localStorage.setItem("padme_user", JSON.stringify(FAKE_USER));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("email")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText("Logout").click();
    });

    await waitFor(() => {
      expect(screen.getByText("Not logged in")).toBeInTheDocument();
    });

    expect(localStorage.getItem("padme_token")).toBeNull();
    expect(localStorage.getItem("padme_user")).toBeNull();
  });
});

describe("useAuth — outside provider", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress React error boundary output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useAuth must be used within AuthProvider");
    consoleSpy.mockRestore();
  });
});
