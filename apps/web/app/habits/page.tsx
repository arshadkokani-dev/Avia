"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import "./habits.css";

type HabitFrequency = "DAILY" | "WEEKLY";

type HabitEntry = {
  id: string;
  entryDate: string;
  completed: boolean;
  amount: number | null;
};

type Habit = {
  id: string;
  name: string;
  description: string | null;
  area: string;
  frequency: HabitFrequency;
  weeklyTarget: number | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  entries: HabitEntry[];
};

type HabitResponse = {
  data: Habit[];
};

const AREAS = [
  "Fitness",
  "Learning",
  "Nutrition",
  "Habits",
  "Career",
  "Relationships",
  "Recovery",
];

function getToday(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getLocalDate(value: string): string {
  const date = new Date(value);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getEntryForToday(habit: Habit): HabitEntry | undefined {
  const today = getToday();

  return habit.entries.find(
    (entry) => getLocalDate(entry.entryDate) === today,
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("Learning");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [weeklyTarget, setWeeklyTarget] = useState(3);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = (await apiRequest("/habits")) as HabitResponse;
      setHabits(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load your habits. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  async function handleCreateHabit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        area,
        frequency,
        ...(frequency === "weekly" ? { weeklyTarget } : {}),
      };

      await apiRequest("/habits", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setName("");
      setDescription("");
      setArea("Learning");
      setFrequency("daily");
      setWeeklyTarget(3);
      setShowForm(false);

      await loadHabits();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create the habit. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleHabit(habit: Habit) {
    const today = getToday();
    const currentEntry = getEntryForToday(habit);
    const completed = !currentEntry?.completed;

    setError("");

    // Update the UI only after the API confirms the saved entry.
    try {
        const entry = (await apiRequest(`/habits/${habit.id}/entries`, {
        method: "PUT",
        body: JSON.stringify({
            date: today,
            completed,
            amount: currentEntry?.amount ?? null,
        }),
        })) as HabitEntry;

        setHabits((current) =>
        current.map((item) =>
            item.id === habit.id
            ? {
                ...item,
                entries: [
                    entry,
                    ...item.entries.filter(
                    (existing) => existing.id !== entry.id,
                    ),
                ].slice(0, 90),
                }
            : item,
        ),
        );
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Couldn't save today's check-in. Please try again.",
        );
    }
    }

  async function handleArchiveHabit(habit: Habit) {
    const confirmed = window.confirm(
      `Archive "${habit.name}"? Its existing history will be preserved.`,
    );

    if (!confirmed || archivingId) return;

    setArchivingId(habit.id);
    setError("");

    try {
      await apiRequest(`/habits/${habit.id}`, {
        method: "DELETE",
      });

      setHabits((current) =>
        current.filter((item) => item.id !== habit.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't archive this habit. Please try again.",
      );
    } finally {
      setArchivingId(null);
    }
  }

  const completedToday = habits.filter(
    (habit) => getEntryForToday(habit)?.completed,
  ).length;

  const dailyHabits = habits.filter(
    (habit) => habit.frequency === "DAILY",
  ).length;

  const weeklyHabits = habits.filter(
    (habit) => habit.frequency === "WEEKLY",
  ).length;

  return (
    <main className="habits-page">
      <header className="habits-header">
        <div>
          <p className="habits-eyebrow">YOUR DAILY SYSTEM</p>
          <h1>Habits</h1>
          <p className="habits-subtitle">
            Small actions. Consistent progress. A life built intentionally.
          </p>
        </div>

        <button
          className="habits-primary-button"
          onClick={() => setShowForm((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">{showForm ? "−" : "+"}</span>
          {showForm ? "Close form" : "Create habit"}
        </button>
      </header>

      <section className="habits-stats" aria-label="Habit overview">
        <article className="habits-stat-card">
          <span className="habits-stat-label">Active habits</span>
          <strong>{habits.length}</strong>
          <span className="habits-stat-note">Your current routines</span>
        </article>

        <article className="habits-stat-card habits-stat-highlight">
          <span className="habits-stat-label">Completed today</span>
          <strong>
            {completedToday}
            <span className="habits-stat-divider">/</span>
            {habits.length}
          </strong>
          <span className="habits-stat-note">
            Habits recorded as complete today
          </span>
        </article>

        <article className="habits-stat-card">
          <span className="habits-stat-label">Daily routines</span>
          <strong>{dailyHabits}</strong>
          <span className="habits-stat-note">
            {weeklyHabits} weekly {weeklyHabits === 1 ? "habit" : "habits"}{" "}
            also active
          </span>
        </article>
      </section>

      {showForm && (
        <section className="habits-form-card">
          <div className="habits-section-heading">
            <div>
              <p className="habits-eyebrow">START SMALL</p>
              <h2>Create a habit</h2>
            </div>
          </div>

          <form className="habits-form" onSubmit={handleCreateHabit}>
            <label className="habits-field habits-field-full">
              Habit name
              <input
                autoFocus
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Solve two DSA problems"
                required
                value={name}
              />
            </label>

            <label className="habits-field habits-field-full">
              Description <span className="habits-optional">(optional)</span>
              <textarea
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does completing this habit look like?"
                rows={2}
                value={description}
              />
            </label>

            <label className="habits-field">
              Life area
              <select
                onChange={(event) => setArea(event.target.value)}
                value={area}
              >
                {AREAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="habits-field">
              Frequency
              <select
                onChange={(event) =>
                  setFrequency(event.target.value as "daily" | "weekly")
                }
                value={frequency}
              >
                <option value="daily">Every day</option>
                <option value="weekly">Weekly target</option>
              </select>
            </label>

            {frequency === "weekly" && (
              <label className="habits-field habits-field-full">
                Target per week
                <select
                  onChange={(event) =>
                    setWeeklyTarget(Number(event.target.value))
                  }
                  value={weeklyTarget}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((target) => (
                    <option key={target} value={target}>
                      {target} {target === 1 ? "time" : "times"} per week
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="habits-form-actions habits-field-full">
              <button
                className="habits-secondary-button"
                onClick={() => setShowForm(false)}
                type="button"
              >
                Cancel
              </button>

              <button
                className="habits-primary-button"
                disabled={saving || !name.trim()}
                type="submit"
              >
                {saving ? "Creating..." : "Create habit"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="habits-error" role="alert">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            type="button"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <section className="habits-list-section">
        <div className="habits-section-heading">
          <div>
            <p className="habits-eyebrow">BUILD YOUR ROUTINE</p>
            <h2>Your habits</h2>
          </div>

          <span className="habits-count">
            {habits.length} {habits.length === 1 ? "habit" : "habits"}
          </span>
        </div>

        {loading ? (
          <div className="habits-state-card">
            <span className="habits-loader" />
            <p>Loading your habits...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="habits-empty-state">
            <div className="habits-empty-icon" aria-hidden="true">
              ◈
            </div>
            <h3>Your next chapter starts small.</h3>
            <p>
              Create your first habit and give your goals a repeatable daily
              action.
            </p>
            <button
              className="habits-primary-button"
              onClick={() => setShowForm(true)}
              type="button"
            >
              + Create your first habit
            </button>
          </div>
        ) : (
          <div className="habits-list">
            {habits.map((habit) => {
              const todayEntry = getEntryForToday(habit);

              return (
                <article className="habits-item" key={habit.id}>
                  <div className="habits-item-icon" aria-hidden="true">
                    {habit.area === "Fitness"
                      ? "↗"
                      : habit.area === "Learning"
                        ? "⌘"
                        : habit.area === "Nutrition"
                          ? "◇"
                          : habit.area === "Career"
                            ? "▤"
                            : habit.area === "Recovery"
                              ? "☾"
                              : "✳"}
                  </div>

                  <div className="habits-item-content">
                    <div className="habits-item-title-row">
                      <h3>{habit.name}</h3>
                      <span className="habits-area-tag">{habit.area}</span>
                    </div>

                    {habit.description && (
                      <p className="habits-item-description">
                        {habit.description}
                      </p>
                    )}

                    <div className="habits-item-meta">
                      <span>
                        {habit.frequency === "DAILY"
                          ? "Daily"
                          : `${habit.weeklyTarget ?? 1}× per week`}
                      </span>

                      <span className="habits-meta-dot">·</span>

                      <span
                        className={
                          todayEntry?.completed
                            ? "habits-today-status is-complete"
                            : "habits-today-status"
                        }
                      >
                        {todayEntry?.completed
                          ? "Completed today"
                          : todayEntry
                            ? "In progress today"
                            : "Not recorded today"}
                      </span>
                    </div>
                  </div>

                  <div className="habits-item-actions">
                    <button
                        className={`habits-checkin-button ${
                        todayEntry?.completed ? "is-complete" : ""
                        }`}
                        disabled={archivingId !== null}
                        onClick={() => void handleToggleHabit(habit)}
                        type="button"
                    >
                        {todayEntry?.completed ? "✓ Completed" : "○ Check in"}
                    </button>

                    <button
                        className="habits-archive-button"
                        disabled={archivingId !== null}
                        onClick={() => void handleArchiveHabit(habit)}
                        type="button"
                    >
                        {archivingId === habit.id ? "Archiving..." : "Archive"}
                    </button>
                   </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="habits-history-preview">
        <div className="habits-history-icon" aria-hidden="true">
          ▦
        </div>
        <div>
          <p className="habits-eyebrow">COMING NEXT</p>
          <h2>Your consistency, over time.</h2>
          <p>
            The next step is daily check-ins and a violet activity heatmap
            powered by your actual habit history.
          </p>
        </div>
      </section>
    </main>
  );
}