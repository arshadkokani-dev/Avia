"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import "./planning.css";

type PlannedTask = {
  id: string;
  title: string;
  scheduledDate: string;
  completed: boolean;
};

type PlanResponse = {
  plan: {
    id?: string;
    weekStart: string;
    tasks: PlannedTask[];
  };
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonday(date: Date) {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return monday;
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(() =>
    getMonday(new Date()),
  );

  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(getDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) =>
      shiftDate(weekStart, index),
    ),
    [weekStart],
  );

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<PlanResponse>(
        `/planning?weekStart=${getDateKey(weekStart)}`,
      );

      setTasks(response.plan.tasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your plan.",
      );
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  async function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    setSaving(true);
    setError("");

    try {
      await apiRequest<PlannedTask>("/planning/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          scheduledDate: selectedDate,
        }),
      });

      setTitle("");
      await loadPlan();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create task.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTask(task: PlannedTask) {
    setError("");

    try {
      await apiRequest<PlannedTask>(`/planning/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, completed: !item.completed }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update task.",
      );
    }
  }

  async function handleDeleteTask(id: string) {
    setError("");

    try {
      await apiRequest<void>(`/planning/tasks/${id}`, {
        method: "DELETE",
      });

      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete task.",
      );
    }
  }

  function changeWeek(amount: number) {
    setWeekStart((current) => shiftDate(current, amount * 7));
  }

  function goToCurrentWeek() {
    setWeekStart(getMonday(new Date()));
  }

  const weekEnd = shiftDate(weekStart, 6);
  const todayKey = getDateKey(new Date());

  return (
    <main className="planning-page">
      <header className="planning-header">
        <div>
          <p className="planning-eyebrow">TURN INTENTION INTO ACTION</p>
          <h1>Weekly Planning</h1>
          <p className="planning-subtitle">
            Decide what matters this week. Then make it happen, one day at a time.
          </p>
        </div>
      </header>

      <section className="planning-overview">
        <div className="planning-overview-card">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
          <small>Planned this week</small>
        </div>

        <div className="planning-overview-card">
          <span>Completed</span>
          <strong className="planning-completed-number">
            {completedCount}
          </strong>
          <small>Tasks finished</small>
        </div>

        <div className="planning-overview-card">
          <span>Remaining</span>
          <strong>{remainingCount}</strong>
          <small>Still on your list</small>
        </div>

        <div className="planning-overview-card planning-progress-card">
          <span>Weekly progress</span>
          <strong>{completionRate}%</strong>
          <div className="planning-progress-track">
            <div
              className="planning-progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </section>

      <section className="planning-week-section">
        <div className="planning-week-toolbar">
          <div>
            <p className="planning-eyebrow">YOUR WEEK</p>
            <h2>
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </h2>
          </div>

          <div className="planning-week-controls">
            <button type="button" onClick={() => changeWeek(-1)}>
              ←
            </button>
            <button
              type="button"
              className="planning-today-button"
              onClick={goToCurrentWeek}
            >
              This week
            </button>
            <button type="button" onClick={() => changeWeek(1)}>
              →
            </button>
          </div>
        </div>

        <form className="planning-add-form" onSubmit={handleAddTask}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you want to accomplish?"
            maxLength={120}
            aria-label="Task title"
            required
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Task date"
            required
          />

          <button type="submit" disabled={saving || !title.trim()}>
            {saving ? "Adding..." : "+ Add task"}
          </button>
        </form>

        {error && (
          <div className="planning-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="planning-state">
            <div className="planning-spinner" />
            <p>Loading your week...</p>
          </div>
        ) : (
          <div className="planning-days">
            {weekDates.map((date, index) => {
              const dateKey = getDateKey(date);

              const dayTasks = tasks.filter(
                (task) => task.scheduledDate.slice(0, 10) === dateKey,
              );

              const dayCompleted = dayTasks.filter(
                (task) => task.completed,
              ).length;

              return (
                <article
                  className={`planning-day ${
                    dateKey === todayKey ? "is-today" : ""
                  }`}
                  key={dateKey}
                >
                  <div className="planning-day-heading">
                    <div>
                      <span className="planning-day-name">
                        {date.toLocaleDateString("en-IN", {
                          weekday: "long",
                        })}
                      </span>
                      <strong>{date.getDate()}</strong>
                      {dateKey === todayKey && (
                        <span className="planning-today-label">TODAY</span>
                      )}
                    </div>

                    <span className="planning-day-count">
                      {dayCompleted}/{dayTasks.length}
                    </span>
                  </div>

                  <div className="planning-day-tasks">
                    {dayTasks.length === 0 ? (
                      <p className="planning-empty-day">
                        Nothing planned yet
                      </p>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          className={`planning-task ${
                            task.completed ? "is-completed" : ""
                          }`}
                          key={task.id}
                        >
                          <button
                            type="button"
                            className="planning-task-check"
                            onClick={() => void handleToggleTask(task)}
                            aria-label={
                              task.completed
                                ? `Reopen ${task.title}`
                                : `Complete ${task.title}`
                            }
                          >
                            {task.completed ? "✓" : ""}
                          </button>

                          <span className="planning-task-title">
                            {task.title}
                          </span>

                          <button
                            type="button"
                            className="planning-task-delete"
                            onClick={() => void handleDeleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="planning-footer">
        <span>✦</span>
        <p>
          Progress comes from consistent action, not a perfect plan.
        </p>
      </section>
    </main>
  );
}