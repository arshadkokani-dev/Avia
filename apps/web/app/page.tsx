"use client";

import { useState } from "react";
import Sidebar from "../src/components/dashboard/Sidebar";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  visible: boolean;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete one focused study session",
    completed: false,
    visible: true,
  },
  {
    id: 2,
    title: "Finish today's workout",
    completed: false,
    visible: true,
  },
  {
    id: 3,
    title: "Review daily goals",
    completed: false,
    visible: true,
  },
];

const areas = [
  { name: "Fitness", score: 72, color: "#8be0ad" },
  { name: "Learning", score: 86, color: "#8cbcff" },
  { name: "Nutrition", score: 64, color: "#e9c77b" },
  { name: "Habits", score: 78, color: "#c1a5ff" },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completed, setCompleted] = useState<number[]>([]);
  const [focus, setFocus] = useState("Today");
  const [newTask, setNewTask] = useState("");
  const [showManager, setShowManager] = useState(false);

  const visibleTasks = tasks.filter((task) => task.visible);
  const completedCount = visibleTasks.filter((task) =>
    completed.includes(task.id)
  ).length;

  // Add a custom action to the checklist
  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTask.trim();
    if (!title) return;

    const id = Date.now();

    setTasks((previous) => [
      ...previous,
      { id, title, completed: false, visible: true },
    ]);
    setNewTask("");
  }

  // Toggle an action's completion status
  function toggleTask(id: number) {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((taskId) => taskId !== id)
        : [...previous, id]
    );
  }

  // Show or hide an action without deleting it
  function toggleVisibility(id: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, visible: !task.visible } : task
      )
    );
  }

  // Remove an action from the list
  function removeTask(id: number) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    setCompleted((previous) => previous.filter((taskId) => taskId !== id));
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
            <strong className="avia-stat-value">75<span>%</span></strong>
            <div className="avia-progress">
              <span style={{ width: "75%" }} />
            </div>
            <small>Room to grow, progress to build</small>
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
            <strong className="avia-stat-value">01<span> goal</span></strong>
            <div className="avia-status"><span /> {focus} priorities</div>
            <small>Keep the important things important</small>
          </article>
        </div>

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

          {/* Existing Life Balance panel stays unchanged */}
          <article className="avia-card avia-balance" id="analytics">
            <div>
              <h2>Life balance</h2>
              <p className="avia-muted">Your key areas, at a glance</p>
            </div>
            <div className="avia-area-list">
              {areas.map((area) => (
                <div className="avia-area" key={area.name}>
                  <div className="avia-area-heading">
                    <span>
                      <i style={{ background: area.color }} />
                      {area.name}
                    </span>
                    <strong>{area.score}%</strong>
                  </div>
                  <div className="avia-progress">
                    <span
                      style={{
                        width: `${area.score}%`,
                        background: area.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="avia-footnote">
              Demo values for now — personalized insights will come later.
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