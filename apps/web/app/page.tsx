"use client";

import { useState } from "react";
import Sidebar from "../src/components/dashboard/Sidebar";

const areas = [
{ name: "Fitness", score: 72, color: "#8be0ad" },
{ name: "Learning", score: 86, color: "#8cbcff" },
{ name: "Nutrition", score: 64, color: "#e9c77b" },
{ name: "Habits", score: 78, color: "#c1a5ff" },
];

const tasks = [
"Complete one focused study session",
"Finish today's workout",
"Review daily goals",
];

export default function Home() {
const [completed, setCompleted] = useState<number[]>([]);
const [focus, setFocus] = useState("Today");

return (
<main className="avia-shell">
<Sidebar />

  <section className="avia-main">
    <header className="avia-header">
      <div>
        <p className="avia-eyebrow">SATURDAY, OCTOBER 10</p>
        <h1>Your life, in motion.</h1>
        <p className="avia-muted">
          Small actions. Meaningful progress. A better-balanced life.
        </p>
      </div>
      <div className="avia-avatar">A</div>
    </header>

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

    <div className="avia-stats">
      <article className="avia-card">
        <span className="avia-card-label">Life balance</span>
        <strong className="avia-stat-value">75<span>%</span></strong>
        <div className="avia-progress"><span style={{ width: "75%" }} /></div>
        <small>Room to grow, progress to build</small>
      </article>
      <article className="avia-card">
        <span className="avia-card-label">Daily actions</span>
        <strong className="avia-stat-value">
          {completed.length}<span>/{tasks.length}</span>
        </strong>
        <div className="avia-progress blue"><span style={{ width: `${completed.length / tasks.length * 100}%` }} /></div>
        <small>{tasks.length - completed.length} actions remaining</small>
      </article>
      <article className="avia-card">
        <span className="avia-card-label">Focus mode</span>
        <strong className="avia-stat-value">01<span> goal</span></strong>
        <div className="avia-status"><span /> {focus} priorities</div>
        <small>Keep the important things important</small>
      </article>
    </div>

    <div className="avia-content-grid">
      <article className="avia-card avia-actions" id="planning">
        <div className="avia-section-heading">
          <div>
            <h2>Today's actions</h2>
            <p className="avia-muted">Consistency beats intensity.</p>
          </div>
          <span className="avia-count">{completed.length}/{tasks.length}</span>
        </div>
        <div className="avia-task-list">
          {tasks.map((task, index) => (
            <label className="avia-task" key={task}>
              <input
                type="checkbox"
                checked={completed.includes(index)}
                onChange={() =>
                  setCompleted((previous) =>
                    previous.includes(index)
                      ? previous.filter((item) => item !== index)
                      : [...previous, index]
                  )
                }
              />
              <span className="avia-check" />
              <span className={completed.includes(index) ? "avia-done" : ""}>
                {task}
              </span>
            </label>
          ))}
        </div>
        <p className="avia-footnote">Your checklist updates as you complete actions.</p>
      </article>

      <article className="avia-card avia-balance" id="analytics">
        <div>
          <h2>Life balance</h2>
          <p className="avia-muted">Your key areas, at a glance</p>
        </div>
        <div className="avia-area-list">
          {areas.map((area) => (
            <div className="avia-area" key={area.name}>
              <div className="avia-area-heading">
                <span><i style={{ background: area.color }} />{area.name}</span>
                <strong>{area.score}%</strong>
              </div>
              <div className="avia-progress">
                <span style={{ width: `${area.score}%`, background: area.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="avia-footnote">
          Demo values for now — personalized insights will come later.
        </p>
      </article>
    </div>

    <footer className="avia-footer">
      <span>AVIA · A Vision in Action</span>
      <span>Designed for progress, not perfection.</span>
    </footer>
  </section>
</main>

);
}