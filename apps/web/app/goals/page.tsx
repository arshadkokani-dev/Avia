"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import "./goals.css";

type GoalType = "milestone" | "recurring";
type GoalFrequency = "daily" | "weekly";
type TrackingMode = "quantity" | "completion";

type ApiTracking = {
  id: string;
  periodStart: string;
  amount: number;
  completed: boolean;
};

type ApiProgressHistory = {
  id: string;
  progress: number;
  createdAt: string;
};

type ApiGoal = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  area: string;
  type: "MILESTONE" | "RECURRING";
  frequency: "DAILY" | "WEEKLY" | null;
  targetDate: string | null;
  progress: number;
  trackingMode: "QUANTITY" | "COMPLETION" | null;
  dailyTarget: number | null;
  unit: string | null;
  trackingRecords: ApiTracking[];
  progressHistory?: ApiProgressHistory[];
};

type Goal = {
  id: string;
  title: string;
  area: string;
  type: GoalType;
  frequency: GoalFrequency | null;
  targetDate: string;
  progress: number;
  trackingMode: TrackingMode | null;
  dailyTarget: number | null;
  unit: string;
  dailyAmount: number;
  dailyCompleted: boolean;
  progressHistory: ApiProgressHistory[];
};

const goalAreas = [
  "Fitness",
  "Learning",
  "Nutrition",
  "Habits",
  "Career",
  "Relationships",
  "Recovery",
];

function isCurrentPeriod(
  periodStart: string,
  frequency: "DAILY" | "WEEKLY" | null,
): boolean {
  if (!frequency) return false;

  const now = new Date();

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (frequency === "WEEKLY") {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  }

  return new Date(periodStart).getTime() === start.getTime();
}

function mapApiGoal(goal: ApiGoal): Goal {
  const record = goal.trackingRecords?.find((item) =>
    isCurrentPeriod(item.periodStart, goal.frequency),
  );

  const type: GoalType =
    goal.type === "RECURRING" ? "recurring" : "milestone";

  const trackingMode: TrackingMode | null =
    goal.trackingMode === "QUANTITY"
      ? "quantity"
      : goal.trackingMode === "COMPLETION"
        ? "completion"
        : null;

  let progress = goal.progress;

  if (type === "recurring") {
    progress =
      trackingMode === "quantity" && goal.dailyTarget
        ? Math.min(
            100,
            Math.round(((record?.amount ?? 0) / goal.dailyTarget) * 100),
          )
        : record?.completed
          ? 100
          : 0;
  }

  return {
    id: goal.id,
    title: goal.title,
    area: goal.area,
    type,
    frequency:
      goal.frequency === "WEEKLY"
        ? "weekly"
        : goal.frequency === "DAILY"
          ? "daily"
          : null,
    targetDate: goal.targetDate?.slice(0, 10) ?? "",
    progress,
    trackingMode,
    dailyTarget: goal.dailyTarget,
    unit: goal.unit ?? "",
    dailyAmount: record?.amount ?? 0,
    dailyCompleted: record?.completed ?? false,
    progressHistory: goal.progressHistory ?? [],
  };
}

type GoalHealth = "completed" | "overdue" | "attention" | "on-track";

function getGoalHealth(goal: Goal): GoalHealth {
  if (goal.progress >= 100) return "completed";
  if (goal.type !== "milestone" || !goal.targetDate) return "on-track";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${goal.targetDate.slice(0, 10)}T00:00:00`);
  const daysLeft = Math.round(
    (deadline.getTime() - today.getTime()) / 86_400_000
  );

  if (daysLeft < 0) return "overdue";

  // Warn when the deadline is close or progress is low for the time left.
  if (daysLeft <= 3 || (daysLeft <= 7 && goal.progress < 50)) {
    return "attention";
  }

  return "on-track";
}

function GoalProgressChart({
  history,
  currentProgress,
}: {
  history: ApiProgressHistory[];
  currentProgress: number;
}) {
  const points = [...history].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );

  // Display the current value without inventing historical records.
  const latest = points[points.length - 1];
  const chartPoints =
    latest && latest.progress === currentProgress
      ? points
      : [
          ...points,
          {
            id: "current",
            progress: currentProgress,
            createdAt: new Date().toISOString(),
          },
        ];

  if (chartPoints.length === 0) {
    return (
      <div className="goals-history-empty">
        Progress history will appear as you update this goal.
      </div>
    );
  }

  const plottedPoints = chartPoints.map((point, index) => ({
    ...point,
    x:
      chartPoints.length === 1
        ? 50
        : 8 + (index / (chartPoints.length - 1)) * 84,
    y:
      88 -
      (Math.min(100, Math.max(0, point.progress)) / 100) * 76,
  }));

  const line = plottedPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="goals-history-chart">
      <div className="goals-history-heading">
        <span>Progress history</span>
        <strong>{currentProgress}% now</strong>
      </div>

      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Goal progress history with ${plottedPoints.length} points`}
        preserveAspectRatio="none"
      >
        {[12, 50, 88].map((y) => (
          <line
            key={y}
            x1="5"
            y1={y}
            x2="95"
            y2={y}
            className="goals-history-gridline"
          />
        ))}

        {plottedPoints.length > 1 && (
          <polyline
            points={line}
            className="goals-history-line"
          />
        )}

        {plottedPoints.map((point) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r="1.8"
            className="goals-history-point"
          >
            <title>
              {point.progress}% —{" "}
              {new Date(point.createdAt).toLocaleDateString("en-IN")}
            </title>
          </circle>
        ))}
      </svg>

      <div className="goals-history-labels">
        <span>
          {new Date(chartPoints[0].createdAt).toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short" },
          )}
        </span>
        <span>
          {new Date(
            chartPoints[chartPoints.length - 1].createdAt,
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [newGoal, setNewGoal] = useState("");
  const [goalArea, setGoalArea] = useState("Learning");
  const [goalType, setGoalType] = useState<GoalType>("milestone");
  const [goalFrequency, setGoalFrequency] =
    useState<GoalFrequency>("daily");
  const [goalDate, setGoalDate] = useState("");
  const [trackingMode, setTrackingMode] =
    useState<TrackingMode>("quantity");
  const [dailyTarget, setDailyTarget] = useState("100");
  const [goalUnit, setGoalUnit] = useState("g");
  const [expandedHistoryGoalId, setExpandedHistoryGoalId] =
    useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setGoalError("");

    try {
      const response = await apiRequest<{ data: ApiGoal[] }>(
        "/goals?page=1&limit=50",
      );

      setGoals(response.data.map(mapApiGoal));
    } catch (error) {
      setGoalError(
        error instanceof Error ? error.message : "Failed to load goals.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const completedGoals = goals.filter(
    (goal) => goal.progress === 100,
  ).length;

  const activeGoals = goals.filter(
    (goal) => goal.progress < 100,
  ).length;

  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((total, goal) => total + goal.progress, 0) /
            goals.length,
        )
      : 0;

  async function addGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newGoal.trim();
    const parsedTarget = Number(dailyTarget);

    if (!title || saving) return;
    if (goalType === "milestone" && !goalDate) return;

    if (
      goalType === "recurring" &&
      trackingMode === "quantity" &&
      (!Number.isFinite(parsedTarget) ||
        parsedTarget <= 0 ||
        !goalUnit.trim())
    ) {
      return;
    }

    setSaving(true);
    setGoalError("");

    try {
      await apiRequest<ApiGoal>("/goals", {
        method: "POST",
        body: JSON.stringify({
          title,
          area: goalArea,
          type: goalType,
          frequency: goalType === "recurring" ? goalFrequency : null,
          targetDate: goalType === "milestone" ? goalDate : null,
          progress: 0,
          trackingMode: goalType === "recurring" ? trackingMode : null,
          dailyTarget:
            goalType === "recurring" && trackingMode === "quantity"
              ? parsedTarget
              : null,
          unit:
            goalType === "recurring" && trackingMode === "quantity"
              ? goalUnit.trim()
              : null,
        }),
      });

      setNewGoal("");
      setGoalArea("Learning");
      setGoalType("milestone");
      setGoalFrequency("daily");
      setGoalDate("");
      setTrackingMode("quantity");
      setDailyTarget("100");
      setGoalUnit("g");
      setShowForm(false);

      await loadGoals();
    } catch (error) {
      setGoalError(
        error instanceof Error ? error.message : "Failed to create goal.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateGoalProgress(id: string, progress: number) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;

    const previousProgress = goal.progress;

    setGoalError("");

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, progress } : item,
      ),
    );

    try {
      await apiRequest<ApiGoal>(`/goals/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          progress,
          status: progress === 100 ? "COMPLETED" : "ACTIVE",
        }),
      });
    } catch (error) {
      setGoals((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, progress: previousProgress }
            : item,
        ),
      );

      setGoalError(
        error instanceof Error
          ? error.message
          : "Failed to save goal progress.",
      );
    }
  }

  async function updateGoalAmount(id: string, amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return;

    const goal = goals.find((item) => item.id === id);

    if (
      !goal ||
      goal.type !== "recurring" ||
      goal.trackingMode !== "quantity" ||
      goal.dailyTarget === null
    ) {
      return;
    }

    const previousAmount = goal.dailyAmount;
    const previousProgress = goal.progress;

    const progress = Math.min(
      100,
      Math.round((amount / goal.dailyTarget) * 100),
    );

    setGoalError("");

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, dailyAmount: amount, progress }
          : item,
      ),
    );

    try {
      await apiRequest<ApiTracking>(
        `/goals/${encodeURIComponent(id)}/tracking`,
        {
          method: "PUT",
          body: JSON.stringify({ amount }),
        },
      );
    } catch (error) {
      setGoals((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                dailyAmount: previousAmount,
                progress: previousProgress,
              }
            : item,
        ),
      );

      setGoalError(
        error instanceof Error
          ? error.message
          : "Failed to save recorded amount.",
      );
    }
  }

  async function toggleRecurringCompletion(id: string) {
    const goal = goals.find((item) => item.id === id);

    if (
      !goal ||
      goal.type !== "recurring" ||
      goal.trackingMode !== "completion"
    ) {
      return;
    }

    const previousCompleted = goal.dailyCompleted;
    const completed = !previousCompleted;

    setGoalError("");

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              dailyCompleted: completed,
              progress: completed ? 100 : 0,
            }
          : item,
      ),
    );

    try {
      await apiRequest<ApiTracking>(
        `/goals/${encodeURIComponent(id)}/tracking`,
        {
          method: "PUT",
          body: JSON.stringify({ completed }),
        },
      );
    } catch (error) {
      setGoals((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                dailyCompleted: previousCompleted,
                progress: previousCompleted ? 100 : 0,
              }
            : item,
        ),
      );

      setGoalError(
        error instanceof Error
          ? error.message
          : "Failed to save completion.",
      );
    }
  }

  async function removeGoal(id: string) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;

    const confirmed = window.confirm(
      `Delete "${goal.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setGoalError("");

    try {
      await apiRequest<void>(`/goals/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setGoals((previous) =>
        previous.filter((item) => item.id !== id),
      );
    } catch (error) {
      setGoalError(
        error instanceof Error ? error.message : "Failed to delete goal.",
      );
    }
  }

  return (
    <main className="avia-shell">
       

      <section className="avia-main goals-main">
        <div className="goals-page">
          <header className="goals-header">
            <div>
              <p className="goals-eyebrow">YOUR PERSONAL LIFE OS</p>
              <h1>Your goals</h1>
              <p className="goals-description">
                Turn your ambitions into clear targets and measurable progress.
                Build momentum one step at a time.
              </p>
            </div>

            <button
              type="button"
              className="goals-primary-button"
              onClick={() => setShowForm((previous) => !previous)}
              aria-expanded={showForm}
            >
              {showForm ? "Cancel" : "+ Create goal"}
            </button>
          </header>

          <section className="goals-summary-grid" aria-label="Goal summary">
            <article className="goals-summary-card">
              <span>Total goals</span>
              <strong>{goals.length}</strong>
              <small>Goals you're tracking</small>
            </article>

            <article className="goals-summary-card">
              <span>In progress</span>
              <strong>{activeGoals}</strong>
              <small>Goals still to work on</small>
            </article>

            <article className="goals-summary-card">
              <span>Completed</span>
              <strong>{completedGoals}</strong>
              <small>Goals at 100% progress</small>
            </article>

            <article className="goals-summary-card">
              <span>Average progress</span>
              <strong>{averageProgress}%</strong>
              <div className="goals-progress-track">
                <span style={{ width: `${averageProgress}%` }} />
              </div>
            </article>
          </section>

          {goalError && (
            <div className="goals-error" role="alert">
              <p>{goalError}</p>
              <button type="button" onClick={() => setGoalError("")}>
                Dismiss
              </button>
            </div>
          )}

          {showForm && (
            <section className="goals-panel">
              <div className="goals-panel-heading">
                <div>
                  <h2>Create a goal</h2>
                  <p>Choose a target that fits your life.</p>
                </div>
              </div>

              <form className="goals-form" onSubmit={addGoal}>
                <div className="goals-field goals-field-wide">
                  <label htmlFor="goal-title">Goal title</label>
                  <input
                    id="goal-title"
                    value={newGoal}
                    onChange={(event) => setNewGoal(event.target.value)}
                    placeholder="e.g. Solve 100 DSA problems"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="goals-field">
                  <label htmlFor="goal-type">Goal type</label>
                  <select
                    id="goal-type"
                    value={goalType}
                    onChange={(event) => {
                      setGoalType(event.target.value as GoalType);
                      setGoalDate("");
                    }}
                  >
                    <option value="milestone">Milestone</option>
                    <option value="recurring">Recurring target</option>
                  </select>
                </div>

                <div className="goals-field">
                  <label htmlFor="goal-area">Life area</label>
                  <select
                    id="goal-area"
                    value={goalArea}
                    onChange={(event) => setGoalArea(event.target.value)}
                  >
                    {goalAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {goalType === "milestone" ? (
                  <div className="goals-field">
                    <label htmlFor="goal-date">Target date</label>
                    <input
                      id="goal-date"
                      type="date"
                      value={goalDate}
                      min={new Date().toLocaleDateString("en-CA")}
                      onChange={(event) => setGoalDate(event.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="goals-field">
                      <label htmlFor="goal-frequency">Frequency</label>
                      <select
                        id="goal-frequency"
                        value={goalFrequency}
                        onChange={(event) =>
                          setGoalFrequency(
                            event.target.value as GoalFrequency,
                          )
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div className="goals-field">
                      <label htmlFor="goal-tracking-mode">
                        Tracking method
                      </label>
                      <select
                        id="goal-tracking-mode"
                        value={trackingMode}
                        onChange={(event) =>
                          setTrackingMode(
                            event.target.value as TrackingMode,
                          )
                        }
                      >
                        <option value="quantity">Track a quantity</option>
                        <option value="completion">Track completion</option>
                      </select>
                    </div>

                    {trackingMode === "quantity" && (
                      <>
                        <div className="goals-field">
                          <label htmlFor="goal-target">Target amount</label>
                          <input
                            id="goal-target"
                            type="number"
                            min="0.01"
                            step="any"
                            value={dailyTarget}
                            onChange={(event) =>
                              setDailyTarget(event.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="goals-field">
                          <label htmlFor="goal-unit">Unit</label>
                          <select
                            id="goal-unit"
                            value={goalUnit}
                            onChange={(event) =>
                              setGoalUnit(event.target.value)
                            }
                          >
                            <option value="g">Grams (g)</option>
                            <option value="ml">Millilitres (ml)</option>
                            <option value="L">Litres (L)</option>
                            <option value="minutes">Minutes</option>
                            <option value="pages">Pages</option>
                            <option value="reps">Repetitions</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="goals-form-actions">
                  <button
                    type="button"
                    className="goals-secondary-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="goals-primary-button"
                    disabled={
                      saving ||
                      !newGoal.trim() ||
                      (goalType === "milestone" && !goalDate) ||
                      (goalType === "recurring" &&
                        trackingMode === "quantity" &&
                        (!Number.isFinite(Number(dailyTarget)) ||
                          Number(dailyTarget) <= 0 ||
                          !goalUnit.trim()))
                    }
                  >
                    {saving ? "Creating..." : "Create goal"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="goals-list-section">
            <div className="goals-list-heading">
              <div>
                <h2>Your goal list</h2>
                <p>Review your targets and update your progress.</p>
              </div>

              <button
                type="button"
                className="goals-secondary-button"
                onClick={() => void loadGoals()}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="goals-empty-state">
                <h3>Loading your goals...</h3>
                <p>Your saved goals will appear here shortly.</p>
              </div>
              ) : goals.length === 0 ? (
              <div className="goals-empty-state">
                <span className="goals-empty-icon" aria-hidden="true">
                  ◎
                </span>

                <h3>Start with one meaningful goal</h3>

                <p>
                  Add a milestone or recurring target to begin tracking your
                  progress across life areas.
                </p>

                <button
                  type="button"
                  className="goals-primary-button"
                  onClick={() => setShowForm(true)}
                >
                  Create your first goal
                </button>
              </div>
            ) : (
              <div className="goals-list">
                {goals.map((goal) => (
                  <article className="goals-item" key={goal.id}>
                    <div className="goals-item-top">
                      <div className="goals-item-copy">
                        <span className="goals-area-tag">{goal.area}</span>

                        <h3>{goal.title}</h3>

                        <p
                          className={`goals-item-meta goals-item-meta--${getGoalHealth(goal)}`}
                        >
                          {goal.type === "recurring"
                            ? `${goal.frequency === "weekly" ? "Weekly" : "Daily"} recurring target`
                            : goal.targetDate
                              ? `Target date: ${new Date(
                                  `${goal.targetDate.slice(0, 10)}T12:00:00`
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}`
                              : "Milestone"}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="goals-delete-button"
                        onClick={() => void removeGoal(goal.id)}
                        aria-label={`Delete goal: ${goal.title}`}
                        title="Delete goal"
                      >
                        ×
                      </button>
                    </div>

                    {goal.type === "recurring" && (
                      <div className="goals-tracking">
                        {goal.trackingMode === "quantity" &&
                        goal.dailyTarget !== null ? (
                          <>
                            <label htmlFor={`goal-amount-${goal.id}`}>
                              Recorded amount ({goal.unit})
                            </label>

                            <input
                              id={`goal-amount-${goal.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={goal.dailyAmount}
                              onChange={(event) => {
                                const value = event.target.value;

                                void updateGoalAmount(
                                  goal.id,
                                  value.trim() === "" ? 0 : Number(value),
                                );
                              }}
                            />

                            <p>
                              Target: {goal.dailyTarget} {goal.unit} ·
                              Remaining:{" "}
                              {Math.max(
                                0,
                                goal.dailyTarget - goal.dailyAmount,
                              )}{" "}
                              {goal.unit}
                            </p>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="goals-secondary-button"
                            onClick={() =>
                              void toggleRecurringCompletion(goal.id)
                            }
                          >
                            {goal.dailyCompleted
                              ? "Mark incomplete"
                              : "Mark complete"}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="goals-progress-heading">
                      <span>Progress</span>
                      <strong>{goal.progress}%</strong>
                    </div>

                    <div
                      className="goals-progress-track"
                      role="img"
                      aria-label={`${goal.title}: ${goal.progress}% complete`}
                    >
                      <span style={{ width: `${goal.progress}%` }} />
                    </div>

                    {goal.type === "milestone" && (
                      <div className="goals-history-toggle">
                        <button
                          type="button"
                          className="goals-history-button"
                          aria-expanded={expandedHistoryGoalId === goal.id}
                          onClick={() =>
                            setExpandedHistoryGoalId((current) =>
                              current === goal.id ? null : goal.id
                            )
                          }
                        >
                          <span>
                            {expandedHistoryGoalId === goal.id
                              ? "Hide progress history"
                              : "View progress history"}
                          </span>
                          <span aria-hidden="true">
                            {expandedHistoryGoalId === goal.id ? "−" : "+"}
                          </span>
                        </button>

                        {expandedHistoryGoalId === goal.id && (
                          <GoalProgressChart
                            history={goal.progressHistory}
                            currentProgress={goal.progress}
                          />
                        )}
                      </div>
                    )}

                    {goal.type === "milestone" && (
                      <div className="goals-range-wrap">
                        <label htmlFor={`goal-progress-${goal.id}`}>
                          Adjust milestone progress
                        </label>

                        <input
                          id={`goal-progress-${goal.id}`}
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={goal.progress}
                          onChange={(event) =>
                            void updateGoalProgress(
                              goal.id,
                              Number(event.target.value),
                            )
                          }
                        />
                      </div>
                    )}

                    <div className="goals-item-footer">
                      <span className={`goals-status is-${getGoalHealth(goal)}`}>
                        {getGoalHealth(goal) === "completed"
                          ? "Completed"
                          : getGoalHealth(goal) === "overdue"
                            ? "Overdue"
                            : getGoalHealth(goal) === "attention"
                              ? "Needs attention"
                              : "On track"}
                      </span>

                      <button
                        type="button"
                        className="goals-secondary-button"
                        onClick={() =>
                          void updateGoalProgress(
                            goal.id,
                            goal.progress === 100 ? 0 : 100,
                          )
                        }
                      >
                        {goal.progress === 100
                          ? "Reopen goal"
                          : "Mark complete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="goals-footer">
            <span>AVIA · A Vision in Action</span>
            <span>Progress, not perfection.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}