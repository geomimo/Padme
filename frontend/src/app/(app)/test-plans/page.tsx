"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { testPlansApi, usersApi, lessonsApi, categoriesApi, quizzesApi } from "@/lib/api";
import type { TestPlan, TestPlanDetail, User, Category, Lesson, QuizAdmin } from "@/types";

type ModalMode = "create" | "edit" | null;

interface PlanForm {
  user_id: string;
  title: string;
  description: string;
  status: string;
  quiz_ids: string[];
}

const EMPTY_FORM: PlanForm = {
  user_id: "",
  title: "",
  description: "",
  status: "active",
  quiz_ids: [],
};

export default function TestPlansPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPlan, setEditingPlan] = useState<TestPlanDetail | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Quiz picker state
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [quizzes, setQuizzes] = useState<QuizAdmin[]>([]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/my-tests");
    }
  }, [user, router]);

  const loadPlans = useCallback(() => {
    testPlansApi.list().then(setPlans).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
    usersApi.list().then(setUsers).catch(console.error);
    categoriesApi.list().then(setCategories).catch(console.error);
  }, [loadPlans]);

  useEffect(() => {
    if (selectedCat) {
      lessonsApi.list(selectedCat).then(setLessons).catch(console.error);
      setSelectedLesson("");
      setQuizzes([]);
    }
  }, [selectedCat]);

  useEffect(() => {
    if (selectedLesson) {
      quizzesApi.listForLesson(selectedLesson).then(setQuizzes).catch(console.error);
    }
  }, [selectedLesson]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingPlan(null);
    setModalMode("create");
  };

  const openEdit = async (plan: TestPlan) => {
    try {
      const detail = await testPlansApi.get(plan.id);
      setEditingPlan(detail);
      setForm({
        user_id: detail.user_id,
        title: detail.title,
        description: detail.description ?? "",
        status: detail.status,
        quiz_ids: detail.items.map((i) => i.quiz_id),
      });
      setModalMode("edit");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load plan");
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.user_id) return;
    setSaving(true);
    try {
      if (modalMode === "create") {
        await testPlansApi.create({
          user_id: form.user_id,
          title: form.title,
          description: form.description || undefined,
          status: form.status,
          quiz_ids: form.quiz_ids,
        });
      } else if (editingPlan) {
        await testPlansApi.update(editingPlan.id, {
          title: form.title,
          description: form.description || undefined,
          status: form.status,
          quiz_ids: form.quiz_ids,
        });
      }
      setModalMode(null);
      loadPlans();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this test plan and all its sessions?")) return;
    try {
      await testPlansApi.delete(id);
      loadPlans();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const toggleQuiz = (quizId: string) => {
    setForm((f) => ({
      ...f,
      quiz_ids: f.quiz_ids.includes(quizId)
        ? f.quiz_ids.filter((id) => id !== quizId)
        : [...f.quiz_ids, quizId],
    }));
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      draft: "bg-yellow-100 text-yellow-700",
      archived: "bg-gray-100 text-gray-500",
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status}
      </span>
    );
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Test Plans</h1>
          <p className="text-gray-500 mt-1">Create and manage custom tests for users</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          + New Test Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold">No test plans yet.</p>
          <p className="text-sm mt-1">Create one to assign custom tests to users.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const assignedUser = users.find((u) => u.id === plan.user_id);
            return (
              <div
                key={plan.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 truncate">{plan.title}</span>
                    {statusBadge(plan.status)}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-500 truncate">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>👤 {assignedUser?.name ?? assignedUser?.email ?? plan.user_id}</span>
                    <span>📝 {plan.item_count} quiz{plan.item_count !== 1 ? "zes" : ""}</span>
                    <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/test-plans/${plan.id}/history`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    History
                  </button>
                  <button
                    onClick={() => openEdit(plan)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-extrabold text-gray-900">
                {modalMode === "create" ? "New Test Plan" : "Edit Test Plan"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Assign to user */}
              {modalMode === "create" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Assign to user *</label>
                  <select
                    value={form.user_id}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Select a user…</option>
                    {users.filter((u) => u.role !== "admin").map((u) => (
                      <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Delta Lake Fundamentals Assessment"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description…"
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Quiz picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Quizzes ({form.quiz_ids.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Pick category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    disabled={!selectedCat}
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 disabled:opacity-40"
                  >
                    <option value="">Pick lesson…</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                {quizzes.length > 0 && (
                  <div className="border-2 border-gray-100 rounded-xl divide-y divide-gray-100 max-h-52 overflow-y-auto">
                    {quizzes.map((q) => {
                      const checked = form.quiz_ids.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? "bg-purple-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleQuiz(q.id)}
                            className="mt-0.5 accent-purple-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">{q.question}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{q.type} · {q.xp_reward} XP</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {form.quiz_ids.length > 0 && (
                  <p className="text-xs text-purple-600 font-semibold mt-2">
                    {form.quiz_ids.length} quiz{form.quiz_ids.length !== 1 ? "zes" : ""} selected
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.user_id}
                className="px-5 py-2 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40"
              >
                {saving ? "Saving…" : modalMode === "create" ? "Create Plan" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
