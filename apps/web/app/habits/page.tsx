"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import "./habits.css";

type HabitFrequency = "DAILY" | "WEEKLY";

type ActivityView = "week" | "month" | "year";

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
  skill: string | null;
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

const SKILLS = [
  "Data Structures & Algorithms",
  "Python",
  "Full-Stack Development",
  "Communication",
  "Writing",
  "Strength & Conditioning",
  "Nutrition",
  "Time Management",
  "Other",
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

function getCompletedDateKeys(habit: Habit): Set<string> {
  return new Set(
    habit.entries
      .filter((entry) => entry.completed)
      .map((entry) => getLocalDate(entry.entryDate)),
  );
}

function getDailyStreaks(habit: Habit): {
  current: number;
  longest: number;
} {
  const completedDates = getCompletedDateKeys(habit);
  const today = new Date();

  const todayKey = getDateKey(today);
  const yesterdayKey = getDateKey(shiftDate(today, -1));

  let current = 0;
  let longest = 0;
  let running = 0;

  const sortedDates = [...completedDates].sort();

  for (const dateKey of sortedDates) {
    const previousDate = shiftDate(new Date(`${dateKey}T12:00:00`), -1);
    const previousKey = getDateKey(previousDate);

    if (completedDates.has(previousKey)) {
      running += 1;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
  }

  let cursor = completedDates.has(todayKey)
    ? today
    : completedDates.has(yesterdayKey)
      ? shiftDate(today, -1)
      : null;

  while (cursor && completedDates.has(getDateKey(cursor))) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }

  return { current, longest };
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getActivityLevel(
  completedCount: number,
  totalHabits: number,
): number {
  if (completedCount === 0 || totalHabits === 0) return 0;

  const ratio = completedCount / totalHabits;

  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;

  return 4;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function getMonthTitle(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function shiftDate(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);

  return result;
}

function getCalendarHeading(view: ActivityView, date: Date): string {
  if (view === "year") {
    return String(date.getFullYear());
  }

  if (view === "month") {
    return getMonthTitle(date);
  }

  const start = getWeekStart(date);
  const end = shiftDate(start, 6);

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${getMonthLabel(end)} ${end.getFullYear()}`;
  }

  return `${start.getDate()} ${getMonthLabel(start)} – ${end.getDate()} ${getMonthLabel(end)} ${end.getFullYear()}`;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activityView, setActivityView] =
   useState<ActivityView>("month");

  const [activityDate, setActivityDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
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
        skill: skill || null,
        frequency,
        ...(frequency === "weekly" ? { weeklyTarget } : {}),
      };

      await apiRequest("/habits", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setName("");
      setDescription("");
      setSkill("");
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

  const todayKey = getToday();

    const activityByDate = new Map<string, number>();

    for (const habit of habits) {
    for (const entry of habit.entries) {
        if (!entry.completed) continue;

        const dateKey = getLocalDate(entry.entryDate);

        activityByDate.set(
        dateKey,
        (activityByDate.get(dateKey) ?? 0) + 1,
        );
    }
    }

    const calendarStart =
    activityView === "year"
        ? new Date(activityDate.getFullYear(), 0, 1)
        : activityView === "month"
        ? new Date(
            activityDate.getFullYear(),
            activityDate.getMonth(),
            1,
            )
        : getWeekStart(activityDate);

    const calendarEnd =
    activityView === "year"
        ? new Date(activityDate.getFullYear(), 11, 31)
        : activityView === "month"
        ? new Date(
            activityDate.getFullYear(),
            activityDate.getMonth() + 1,
            0,
            )
        : shiftDate(calendarStart, 6);

    const calendarDays: Date[] = [];

    for (
    const date = new Date(calendarStart);
    date <= calendarEnd;
    date.setDate(date.getDate() + 1)
    ) {
    calendarDays.push(new Date(date));
    }

    const displayedCheckIns = calendarDays.reduce(
    (total, date) => total + (activityByDate.get(getDateKey(date)) ?? 0),
    0,
    );

    const displayedActiveDays = calendarDays.filter(
    (date) => (activityByDate.get(getDateKey(date)) ?? 0) > 0,
    ).length;

    function navigateActivity(amount: number) {
    setActivityDate((current) => {
        if (activityView === "year") {
        return new Date(current.getFullYear() + amount, 0, 1);
        }

        if (activityView === "month") {
        return shiftMonth(current, amount);
        }

        const start = getWeekStart(current);
        return shiftDate(start, amount * 7);
    });
    }

    function resetActivityDate() {
    const today = new Date();

    setActivityDate(
        activityView === "week"
        ? getWeekStart(today)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
    }

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
              Skill <span className="habits-optional">(optional)</span>
              <select
                onChange={(event) => setSkill(event.target.value)}
                value={skill}
              >
                <option value="">No associated skill</option>
                {SKILLS.map((item) => (
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

              const streaks =
                habit.frequency === "DAILY"
                  ? getDailyStreaks(habit)
                  : null;

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

                    {habit.skill && (
                      <div className="habits-skill-row">
                        <span className="habits-skill-label">SKILL</span>
                        <span className="habits-skill-tag">{habit.skill}</span>
                      </div>
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

                    {streaks && (
                      <div className="habits-streak-row">
                        <span className="habits-streak-current">
                          🔥 {streaks.current}-day streak
                        </span>

                        <span className="habits-streak-longest">
                          Best: {streaks.longest}{" "}
                          {streaks.longest === 1 ? "day" : "days"}
                        </span>
                      </div>
                    )}
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

     <section className="habits-heatmap-card">
        <div className="habits-heatmap-header">
            <div>
            <p className="habits-eyebrow">YOUR CONSISTENCY</p>
            <h2>Activity over time</h2>
            <p className="habits-heatmap-subtitle">
                Every check-in is a step forward.
            </p>
            </div>

            <div className="habits-view-switcher" aria-label="Activity calendar view">
            {(["week", "month", "year"] as ActivityView[]).map((view) => (
                <button
                key={view}
                type="button"
                className={
                    activityView === view
                    ? "habits-view-button is-active"
                    : "habits-view-button"
                }
                aria-pressed={activityView === view}
                onClick={() => {
                    setActivityView(view);

                    const today = new Date();

                    setActivityDate(
                    view === "week"
                        ? getWeekStart(today)
                        : view === "year"
                        ? new Date(today.getFullYear(), 0, 1)
                        : new Date(today.getFullYear(), today.getMonth(), 1),
                    );
                }}
                >
                {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
            ))}
            </div>
        </div>

        <div className="habits-calendar-toolbar">
            <button
            type="button"
            className="habits-calendar-nav"
            onClick={() => navigateActivity(-1)}
            aria-label="Previous period"
            >
            ←
            </button>

            <h3>{getCalendarHeading(activityView, activityDate)}</h3>

            <button
            type="button"
            className="habits-calendar-nav"
            onClick={() => navigateActivity(1)}
            aria-label="Next period"
            >
            →
            </button>

            <button
            type="button"
            className="habits-today-button"
            onClick={resetActivityDate}
            >
            Today
            </button>
        </div>

        <div className="habits-heatmap-summary">
            <div>
            <strong>{displayedCheckIns}</strong>
            <span>Completed check-ins</span>
            </div>

            <div>
            <strong>{displayedActiveDays}</strong>
            <span>Active days</span>
            </div>
        </div>

        {activityView === "year" ? (
            <div className="habits-year-calendar">
            {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(
                activityDate.getFullYear(),
                monthIndex,
                1,
                );

                const monthStart = new Date(
                activityDate.getFullYear(),
                monthIndex,
                1,
                );

                const monthEnd = new Date(
                activityDate.getFullYear(),
                monthIndex + 1,
                0,
                );

                const leadingDays = (monthStart.getDay() + 6) % 7;

                const monthDays: (Date | null)[] = Array.from(
                { length: leadingDays },
                (): Date | null => null,
                );

                for (
                    let day = new Date(monthStart);
                    day <= monthEnd;
                    day.setDate(day.getDate() + 1)
                    ) {
                monthDays.push(new Date(day));
                    }
                return (
                <div className="habits-year-month" key={monthIndex}>
                    <h4>{getMonthLabel(monthDate)}</h4>

                    <div className="habits-mini-calendar">
                    {["M", "T", "W", "T", "F", "S", "S"].map(
                        (weekday, index) => (
                        <span
                            className="habits-mini-weekday"
                            key={`${weekday}-${index}`}
                        >
                            {weekday}
                        </span>
                        ),
                    )}

                    {monthDays.map((date, index) => {
                        if (!date) {
                        return (
                            <span
                            className="habits-mini-empty"
                            key={`empty-${index}`}
                            />
                        );
                        }

                        const key = getDateKey(date);
                        const count = activityByDate.get(key) ?? 0;
                        const level = getActivityLevel(count, dailyHabits);

                        return (
                        <span
                            key={key}
                            className={`habits-mini-day level-${level}`}
                            title={`${key}: ${count} completed check-ins`}
                        >
                            {date.getDate()}
                        </span>
                        );
                    })}
                    </div>
                </div>
                );
            })}
            </div>
        ) : (
            <div className="habits-month-calendar">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (weekday) => (
                <span className="habits-calendar-weekday" key={weekday}>
                    {weekday}
                </span>
                ),
            )}

            {(() => {
                const leadingDays = (calendarStart.getDay() + 6) % 7;

                return (
                <>
                    {Array.from({ length: leadingDays }, (_, index) => (
                    <span
                        className="habits-calendar-empty"
                        key={`empty-${index}`}
                    />
                    ))}

                    {calendarDays.map((date) => {
                    const dateKey = getDateKey(date);
                    const count = activityByDate.get(dateKey) ?? 0;
                    const level = getActivityLevel(count, dailyHabits);
                    const isToday = dateKey === todayKey;

                    return (
                        <div
                        key={dateKey}
                        className={`habits-calendar-day level-${level}${
                            isToday ? " is-today" : ""
                        }`}
                        title={`${dateKey}: ${count} completed check-ins`}
                        >
                        <span>{date.getDate()}</span>

                        {count > 0 && (
                            <small>
                            {count} {count === 1 ? "check-in" : "check-ins"}
                            </small>
                        )}
                        </div>
                    );
                    })}
                </>
                );
            })()}
            </div>
        )}

        <div className="habits-heatmap-legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
            <span
                key={level}
                className={`habits-heatmap-cell level-${level}`}
                aria-hidden="true"
            />
            ))}
            <span>More</span>
        </div>

        <p className="habits-heatmap-footnote">
            Activity is calculated from recorded completed check-ins.
            Empty dates indicate no completed check-ins were recorded.
        </p>
        </section>
    </main>
  );
}