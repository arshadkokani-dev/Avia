"use client";

import { useState } from "react";
import Sidebar from "../src/components/dashboard/Sidebar";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  visible: boolean;
};

type GoalType = "milestone" | "recurring";
type GoalFrequency = "daily" | "weekly";
type TrackingMode = "quantity" | "completion";

type Goal = {
  id: number;
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
};

const initialTasks: Task[] = [
  { id: 1, title: "Complete one focused study session", completed: false, visible: true },
  { id: 2, title: "Finish today's workout", completed: false, visible: true },
  { id: 3, title: "Review daily goals", completed: false, visible: true },
];

const areas = [
  { name: "Fitness", score: 72, color: "#8be0ad" },
  { name: "Learning", score: 86, color: "#8cbcff" },
  { name: "Nutrition", score: 64, color: "#e9c77b" },
  { name: "Habits", score: 78, color: "#c1a5ff" },
];

const goalAreas = [
  "Fitness",
  "Learning",
  "Nutrition",
  "Habits",
  "Career",
  "Relationships",
  "Recovery",
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completed, setCompleted] = useState<number[]>([]);
  const [focus, setFocus] = useState("Today");
  const [newTask, setNewTask] = useState("");
  const [showManager, setShowManager] = useState(false);

  // Goals management state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [goalArea, setGoalArea] = useState("Learning");
  const [goalType, setGoalType] = useState<GoalType>("milestone");
  const [goalFrequency, setGoalFrequency] =
    useState<GoalFrequency>("daily");
  const [goalDate, setGoalDate] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [trackingMode, setTrackingMode] =
  useState<TrackingMode>("quantity");
  const [dailyTarget, setDailyTarget] = useState("100");
  const [goalUnit, setGoalUnit] = useState("g");
  const visibleTasks = tasks.filter((task) => task.visible);
  const completedCount = visibleTasks.filter((task) =>
    completed.includes(task.id)
  ).length;
  const completedGoals = goals.filter((goal) => goal.progress === 100).length;
  const activeGoals = goals.filter((goal) => goal.progress < 100).length;

  // Calculate progress from goals assigned to each life area
  const trackedAreas = areas.map((area) => {
    const areaGoals = goals.filter((goal) => goal.area === area.name);

    const score = areaGoals.length
      ? Math.round(
          areaGoals.reduce((total, goal) => total + goal.progress, 0) /
            areaGoals.length
        )
      : null;

    return { ...area, score, goalCount: areaGoals.length };
  });

  // Calculate an average using only life areas with goals
  const trackedScores = trackedAreas
    .map((area) => area.score)
    .filter((score): score is number => score !== null);

  const balanceScore = trackedScores.length
    ? Math.round(
        trackedScores.reduce((total, score) => total + score, 0) /
          trackedScores.length
      )
    : null;

  // Add a custom action to the checklist
  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    setTasks((previous) => [
      ...previous,
      { id: Date.now(), title, completed: false, visible: true },
    ]);
    setNewTask("");
  }

  function toggleTask(id: number) {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((taskId) => taskId !== id)
        : [...previous, id]
    );
  }

  function toggleVisibility(id: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, visible: !task.visible } : task
      )
    );
  }

  function removeTask(id: number) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    setCompleted((previous) => previous.filter((taskId) => taskId !== id));
  }

  // Create a milestone or recurring goal
function addGoal(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const title = newGoal.trim();
  const parsedTarget = Number(dailyTarget);

  if (!title) return;
  if (goalType === "milestone" && !goalDate) return;

  if (
    goalType === "recurring" &&
    trackingMode === "quantity" &&
    (!Number.isFinite(parsedTarget) || parsedTarget <= 0 || !goalUnit.trim())
  ) {
    return;
  }

  setGoals((previous) => [
    ...previous,
    {
      id: Date.now(),
      title,
      area: goalArea,
      type: goalType,
      frequency: goalType === "recurring" ? goalFrequency : null,
      targetDate: goalType === "milestone" ? goalDate : "",
      progress: 0,
      trackingMode: goalType === "recurring" ? trackingMode : null,
      dailyTarget:
        goalType === "recurring" && trackingMode === "quantity"
          ? parsedTarget
          : null,
      unit:
        goalType === "recurring" && trackingMode === "quantity"
          ? goalUnit.trim()
          : "",
      dailyAmount: 0,
      dailyCompleted: false,
    },
  ]);

  setNewGoal("");
  setGoalArea("Learning");
  setGoalType("milestone");
  setGoalFrequency("daily");
  setTrackingMode("quantity");
  setDailyTarget("100");
  setGoalUnit("g");
  setGoalDate("");
  setShowGoalForm(false);
}

  // Update progress or mark a goal complete
  function updateGoalProgress(id: number, progress: number) {
    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === id ? { ...goal, progress } : goal
      )
    );
  }

  // Update the amount recorded for a recurring goal
  function updateGoalAmount(id: number, amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return;

    setGoals((previous) =>
      previous.map((goal) => {
        if (
          goal.id !== id ||
          goal.type !== "recurring" ||
          goal.trackingMode !== "quantity" ||
          goal.dailyTarget === null
        ) {
          return goal;
        }

        const progress = Math.min(
          100,
          Math.round((amount / goal.dailyTarget) * 100)
        );

        return {
          ...goal,
          dailyAmount: amount,
          progress,
        };
      })
    );
  }

  // Toggle completion for a completion-based recurring goal
  function toggleRecurringCompletion(id: number) {
    setGoals((previous) =>
      previous.map((goal) => {
        if (
          goal.id !== id ||
          goal.type !== "recurring" ||
          goal.trackingMode !== "completion"
        ) {
          return goal;
        }

        const dailyCompleted = !goal.dailyCompleted;

        return {
          ...goal,
          dailyCompleted,
          progress: dailyCompleted ? 100 : 0,
        };
      })
    );
  }

  function removeGoal(id: number) {
    setGoals((previous) => previous.filter((goal) => goal.id !== id));
  }

  return (
    <main className="avia-shell">
      <Sidebar />

      <section className="avia-main">
        {/* Dashboard heading */}
        <header className="avia-header">
          <div>
            <p className="avia-eyebrow">YOUR PERSONAL DASHBOARD</p>
            <h1>Your life, in motion.</h1>
            <p className="avia-muted">
              Small actions. Meaningful progress. A better-balanced life.
            </p>
          </div>
          <div className="avia-avatar">A</div>
        </header>

        {/* Welcome card */}
        <div className="avia-welcome">
          <div>
            <span className="avia-pill">✦ YOUR PERSONAL LIFE OS</span>
            <h2>Build momentum, one day at a time.</h2>
            <p>
              Progress isn't doing everything. It's making the right things
              work together.
            </p>
          </div>
          <div className="avia-orb" aria-hidden="true">
            <span>AV</span>
          </div>
        </div>

        {/* Overview period selector */}
        <div className="avia-section-heading">
          <div>
            <h2>Your overview</h2>
            <p className="avia-muted">A snapshot of your personal progress</p>
          </div>
          <select
            aria-label="Dashboard period"
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
          >
            <option>Today</option>
            <option>This week</option>
          </select>
        </div>

        {/* Summary cards */}
        <div className="avia-stats">
          <article className="avia-card">
            <span className="avia-card-label">Life balance</span>
            <strong className="avia-stat-value">
              {balanceScore === null ? "—" : balanceScore}
              {balanceScore !== null && <span>%</span>}
            </strong>
            <div className="avia-progress">
              <span style={{ width: `${balanceScore ?? 0}%` }} />
            </div>
            <small>
              {balanceScore === null
                ? "Add goals to track progress"
                : `Progress across ${trackedScores.length} tracked ${
                    trackedScores.length === 1 ? "area" : "areas"
                  }`}
            </small>
          </article>

          <article className="avia-card">
            <span className="avia-card-label">Daily actions</span>
            <strong className="avia-stat-value">
              {completedCount}<span>/{visibleTasks.length}</span>
            </strong>
            <div className="avia-progress blue">
              <span
                style={{
                  width: `${
                    visibleTasks.length
                      ? (completedCount / visibleTasks.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <small>
              {visibleTasks.length - completedCount} actions remaining
            </small>
          </article>

          <article className="avia-card">
            <span className="avia-card-label">Focus mode</span>
            <strong className="avia-stat-value">
              {activeGoals}<span> active</span>
            </strong>
            <div className="avia-status">
              <span /> {focus} priorities
            </div>
            <small>Keep the important things important</small>
          </article>
        </div>

        {/* Goals management */}
        <section className="avia-card avia-goals" id="goals">
          <div className="avia-section-heading avia-goals-heading">
            <div>
              <h2>Your goals</h2>
              <p className="avia-muted">
                Turn bigger ambitions into measurable progress.
              </p>
            </div>
            <button
              type="button"
              className="avia-goal-primary"
              onClick={() => setShowGoalForm((previous) => !previous)}
              aria-expanded={showGoalForm}
            >
              {showGoalForm ? "Cancel" : "+ Add goal"}
            </button>
          </div>

          <div className="avia-goal-summary">
            <span>{goals.length} total goals</span>
            <span>{completedGoals} completed</span>
          </div>

          {showGoalForm && (
  <form className="avia-goal-form" onSubmit={addGoal}>
    <div className="avia-goal-field avia-goal-title-field">
      <label htmlFor="avia-goal-title">Goal title</label>
      <input
        id="avia-goal-title"
        value={newGoal}
        onChange={(event) => setNewGoal(event.target.value)}
        placeholder="e.g. Solve 100 DSA problems"
        maxLength={100}
        required
      />
    </div>

    <div className="avia-goal-field">
      <label htmlFor="avia-goal-type">Goal type</label>
      <select
        id="avia-goal-type"
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

    <div className="avia-goal-field">
      <label htmlFor="avia-goal-area">Life area</label>
      <select
        id="avia-goal-area"
        value={goalArea}
        onChange={(event) => setGoalArea(event.target.value)}
      >
        {goalAreas.map((area) => (
          <option key={area}>{area}</option>
        ))}
      </select>
    </div>

    {goalType === "recurring" ? (
        <>
          <div className="avia-goal-field">
            <label htmlFor="avia-goal-frequency">Frequency</label>
            <select
              id="avia-goal-frequency"
              value={goalFrequency}
              onChange={(event) =>
                setGoalFrequency(event.target.value as GoalFrequency)
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="avia-goal-field">
            <label htmlFor="avia-tracking-mode">Tracking method</label>
            <select
              id="avia-tracking-mode"
              value={trackingMode}
              onChange={(event) =>
                setTrackingMode(event.target.value as TrackingMode)
              }
            >
              <option value="quantity">Track a quantity</option>
              <option value="completion">Track completion</option>
            </select>
          </div>

          {trackingMode === "quantity" && (
            <>
              <div className="avia-goal-field">
                <label htmlFor="avia-daily-target">Target amount</label>
                <input
                  id="avia-daily-target"
                  type="number"
                  min="0.01"
                  step="any"
                  value={dailyTarget}
                  onChange={(event) => setDailyTarget(event.target.value)}
                  required
                />
              </div>

              <div className="avia-goal-field">
                <label htmlFor="avia-goal-unit">Unit</label>
                <select
                  id="avia-goal-unit"
                  value={goalUnit}
                  onChange={(event) => setGoalUnit(event.target.value)}
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
      ) : (
  <div className="avia-goal-field">
    <label htmlFor="avia-goal-date">Target date</label>
    <input
      id="avia-goal-date"
      type="date"
      value={goalDate}
      min={new Date().toLocaleDateString("en-CA")}
      onChange={(event) => setGoalDate(event.target.value)}
      required
    />
  </div>
)}

    <button
      type="submit"
      className="avia-goal-primary avia-goal-submit"
      disabled={
      !newGoal.trim() ||
      (goalType === "milestone" && !goalDate) ||
      (goalType === "recurring" &&
        trackingMode === "quantity" &&
        (!Number.isFinite(Number(dailyTarget)) ||
          Number(dailyTarget) <= 0 ||
          !goalUnit.trim()))
    }
    >
      Create goal
    </button>
  </form>
)}

          {goals.length === 0 ? (
            <div className="avia-goals-empty">
              <span className="avia-goal-target-icon">◎</span>
              <h3>No goals added yet</h3>
              <p className="avia-muted">
                Start with one meaningful goal. You can update its progress
                as you work towards it.
              </p>
              {!showGoalForm && (
                <button
                  type="button"
                  className="avia-goal-secondary"
                  onClick={() => setShowGoalForm(true)}
                >
                  Create your first goal
                </button>
              )}
            </div>
          ) : (
            <div className="avia-goal-list">
              {goals.map((goal) => (
                <article className="avia-goal-item" key={goal.id}>
                  <div className="avia-goal-item-heading">
                    <div className="avia-goal-copy">
                      <span className="avia-goal-area">{goal.area}</span>
                    <h3>{goal.title}</h3>
                    <p className="avia-muted">
                      {goal.type === "recurring"
                        ? `Recurring · ${goal.frequency === "daily" ? "Daily" : "Weekly"}`
                        : goal.targetDate
                          ? `Target: ${new Date(
                              `${goal.targetDate}T12:00:00`
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
                      className="avia-goal-delete"
                      onClick={() => removeGoal(goal.id)}
                      aria-label={`Delete goal: ${goal.title}`}
                      title="Delete goal"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>

                  {goal.type === "recurring" && (
                    <div className="avia-goal-tracking">
                      {goal.trackingMode === "quantity" && goal.dailyTarget !== null ? (
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

                              if (value.trim() === "") {
                                updateGoalAmount(goal.id, 0);
                                return;
                              }

                              updateGoalAmount(goal.id, Number(value));
                            }}
                          />

                          <p className="avia-muted">
                            Target: {goal.dailyTarget} {goal.unit} · Remaining:{" "}
                            {Math.max(0, goal.dailyTarget - goal.dailyAmount)} {goal.unit}
                          </p>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="avia-goal-secondary"
                          onClick={() => toggleRecurringCompletion(goal.id)}
                        >
                          {goal.dailyCompleted ? "Mark incomplete" : "Mark complete"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="avia-goal-progress-heading">
                    <span>Progress</span>
                    <strong>{goal.progress}%</strong>
                  </div>

                  {goal.type === "milestone" && (
                    <input
                      className="avia-goal-range"
                      id={`goal-progress-${goal.id}`}
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={goal.progress}
                      onChange={(event) =>
                        updateGoalProgress(goal.id, Number(event.target.value))
                      }
                      aria-label={`Progress for ${goal.title}`}
                    />
                  )}

                  <div className="avia-goal-progress-track">
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>

                  <div className="avia-goal-item-footer">
                    <span
                      className={
                        goal.progress === 100
                          ? "avia-goal-status is-complete"
                          : "avia-goal-status"
                      }
                    >
                      {goal.progress === 100 ? "Completed" : "In progress"}
                    </span>
                    <button
                      type="button"
                      className="avia-goal-secondary"
                      onClick={() =>
                        updateGoalProgress(
                          goal.id,
                          goal.progress === 100 ? 0 : 100
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

        {/* Today's actions and checklist controls */}
        <div className="avia-content-grid">
          <article className="avia-card avia-actions" id="planning">
            <div className="avia-section-heading">
              <div>
                <h2>Today's actions</h2>
                <p className="avia-muted">Consistency beats intensity.</p>
              </div>
              <span className="avia-count">
                {completedCount}/{visibleTasks.length}
              </span>
            </div>

            <button
              type="button"
              className="avia-action-manager-toggle"
              onClick={() => setShowManager((previous) => !previous)}
              aria-expanded={showManager}
            >
              {showManager ? "Close action manager" : "Manage actions"}
            </button>

            {showManager && (
              <div className="avia-action-manager">
                <form onSubmit={addTask} className="avia-add-task-form">
                  <label htmlFor="avia-new-task">Add your own action</label>
                  <div className="avia-add-task-row">
                    <input
                      id="avia-new-task"
                      type="text"
                      value={newTask}
                      onChange={(event) => setNewTask(event.target.value)}
                      placeholder="e.g. Read for 20 minutes"
                      maxLength={100}
                    />
                    <button type="submit" disabled={!newTask.trim()}>
                      Add
                    </button>
                  </div>
                </form>

                <p className="avia-footnote">
                  Choose which actions appear in your daily checklist.
                </p>

                {tasks.map((task) => (
                  <div className="avia-task-setting" key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.visible}
                        onChange={() => toggleVisibility(task.id)}
                      />
                      <span>{task.title}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      aria-label={`Remove ${task.title}`}
                      title="Remove action"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="avia-task-list">
              {visibleTasks.length === 0 ? (
                <p className="avia-muted">
                  No actions selected. Open Manage actions to add or show one.
                </p>
              ) : (
                visibleTasks.map((task) => (
                  <label className="avia-task" key={task.id}>
                    <input
                      type="checkbox"
                      checked={completed.includes(task.id)}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="avia-check" />
                    <span
                      className={
                        completed.includes(task.id) ? "avia-done" : ""
                      }
                    >
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>

            <p className="avia-footnote">
              Your counts and progress update as you complete actions.
            </p>
          </article>

          {/* Life Balance panel remains unchanged */}
          <article className="avia-card avia-balance" id="analytics">
            <div>
              <h2>Life balance</h2>
              <p className="avia-muted">Your key areas, at a glance</p>
            </div>
            <div className="avia-area-list">
              {trackedAreas.map((area) => (
                <div className="avia-area" key={area.name}>
                  <div className="avia-area-heading">
                  <span>
                    <i style={{ background: area.color }} />
                    {area.name}
                  </span>
                  <strong>
                    {area.score === null ? "Not tracked" : `${area.score}%`}
                  </strong>
                </div>

                <div className="avia-progress">
                  <span
                    style={{
                      width: `${area.score ?? 0}%`,
                      background: area.color,
                    }}
                  />
                </div>

                {area.goalCount > 0 && (
                  <small>
                    Based on {area.goalCount}{" "}
                    {area.goalCount === 1 ? "goal" : "goals"}
                  </small>
                )}
                </div>
              ))}
            </div>
            <p className="avia-footnote">
              Progress reflects your goals in each tracked life area, not an overall
              assessment of wellbeing.
            </p>
          </article>
        </div>

        {/* Dashboard footer */}
        <footer className="avia-footer">
          <span>AVIA · A Vision in Action</span>
          <span>Designed for progress, not perfection.</span>
        </footer>
      </section>
    </main>
  );
}