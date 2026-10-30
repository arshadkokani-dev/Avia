"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import "./analytics.css";

type LifeArea =
  | "Fitness"
  | "Learning"
  | "Nutrition"
  | "Habits"
  | "Career"
  | "Relationships"
  | "Recovery";

type ApiGoal = {
  id: string;
  title: string;
  area: LifeArea;
  progress: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  type: "MILESTONE" | "RECURRING";
  targetDate: string | null;
};

type AreaData = {
  name: LifeArea;
  color: string;
  score: number | null;
  goalCount: number;
  completedCount: number;
};

const lifeAreas: { name: LifeArea; color: string }[] = [
  { name: "Fitness", color: "#91e6ac" },
  { name: "Learning", color: "#8cbcff" },
  { name: "Nutrition", color: "#ffd36b" },
  { name: "Habits", color: "#c1a5ff" },
  { name: "Career", color: "#69d7e8" },
  { name: "Relationships", color: "#e6a5d7" },
  { name: "Recovery", color: "#a6c7ff" },
];

export default function AnalyticsPage() {
  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const response = await apiRequest<{ data: ApiGoal[] }>(
          "/goals?page=1&limit=50"
        );

        if (cancelled) return;

        setGoals(response.data);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analytics."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate progress independently for each life area.
  const areaData: AreaData[] = lifeAreas.map((area) => {
    const areaGoals = goals.filter(
      (goal) => goal.area === area.name && goal.status !== "PAUSED"
    );

    const score =
      areaGoals.length > 0
        ? Math.round(
            areaGoals.reduce(
              (total, goal) =>
                total + Math.max(0, Math.min(100, goal.progress)),
              0
            ) / areaGoals.length
          )
        : null;

    return {
      ...area,
      score,
      goalCount: areaGoals.length,
      completedCount: areaGoals.filter(
        (goal) => goal.progress >= 100
      ).length,
    };
  });

  const trackedAreas = areaData.filter(
    (area) => area.score !== null
  );

  const overallScore =
    trackedAreas.length > 0
      ? Math.round(
          trackedAreas.reduce(
            (total, area) => total + (area.score ?? 0),
            0
          ) / trackedAreas.length
        )
      : null;

  const totalGoals = goals.filter(
    (goal) => goal.status !== "PAUSED"
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.status === "COMPLETED" || goal.progress >= 100
  ).length;

  const strongestArea =
    trackedAreas.length > 0
      ? [...trackedAreas].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )[0]
      : null;

  const weakestArea =
    trackedAreas.length > 0
      ? [...trackedAreas].sort(
          (a, b) => (a.score ?? 0) - (b.score ?? 0)
        )[0]
      : null;

  // Build radar coordinates for the seven life dimensions.
  const center = 180;
  const radius = 125;

  const getPoint = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / lifeAreas.length;
    const distance = radius * (value / 100);

    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  const radarPoints = areaData
    .map((area, index) => {
      const point = getPoint(index, area.score ?? 0);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const radarGrid = [25, 50, 75, 100].map((level) =>
    lifeAreas
      .map((_, index) => {
        const point = getPoint(index, level);
        return `${point.x},${point.y}`;
      })
      .join(" ")
  );

  return (
    <main className="avia-app analytics-app">
      <section className="avia-main analytics-main">
        <div className="analytics-page">
          <header className="analytics-header">
            <div>
              <p className="analytics-eyebrow">
                YOUR PERSONAL LIFE OS
              </p>
              <h1 className="analytics-title">Life Analytics</h1>
              <p className="analytics-description">
                Understand how your goals are progressing across the
                seven dimensions of your life.
              </p>
            </div>
          </header>

          {loading ? (
            <div className="analytics-card analytics-state">
              Loading your life analytics...
            </div>
          ) : error ? (
            <div className="analytics-card analytics-state" role="alert">
              {error}
              <p className="analytics-card-description">
                Check your connection and try refreshing the page.
              </p>
            </div>
          ) : (
            <>
              {/* Overall analytics summary */}
              <section className="analytics-summary-grid">
                <article className="analytics-card">
                  <p className="analytics-metric-label">
                    LIFE BALANCE SCORE
                  </p>
                  <h2 className="analytics-metric analytics-score">
                    {overallScore === null ? "—" : `${overallScore}%`}
                  </h2>
                  <p className="analytics-card-description">
                    Average progress across {trackedAreas.length} tracked
                    life areas.
                  </p>
                </article>

                <article className="analytics-card">
                  <p className="analytics-metric-label">
                    ACTIVE GOALS
                  </p>
                  <h2 className="analytics-metric">
                    {totalGoals}
                  </h2>
                  <p className="analytics-card-description">
                    Goals currently included in your analytics.
                  </p>
                </article>

                <article className="analytics-card">
                  <p className="analytics-metric-label">
                    COMPLETED GOALS
                  </p>
                  <h2 className="analytics-metric analytics-score">
                    {completedGoals}
                  </h2>
                  <p className="analytics-card-description">
                    Goals that have reached completion.
                  </p>
                </article>
              </section>

              {/* Seven-dimensional radar chart */}
              <section className="analytics-card analytics-radar-card">
                <div className="analytics-section-heading">
                  <div>
                    <p className="analytics-metric-label">
                      YOUR LIFE DIMENSIONS
                    </p>
                    <h2>Life Balance Radar</h2>
                    <p className="analytics-card-description">
                      Compare your average goal progress across all seven
                      areas.
                    </p>
                  </div>
                  <span className="analytics-chart-legend">
                    <i />
                    Goal progress
                  </span>
                </div>

                {trackedAreas.length === 0 ? (
                  <div className="analytics-empty-state">
                    <div>
                      <h3>Your life map starts here</h3>
                      <p>
                        Add goals in your life areas to generate your
                        personalized radar chart.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="analytics-radar-layout">
                    <div className="analytics-radar-visual">
                      <svg
                        viewBox="0 0 360 360"
                        role="img"
                        aria-label="Radar chart showing goal progress across seven life areas"
                      >
                        {radarGrid.map((points, index) => (
                          <polygon
                            key={index}
                            points={points}
                            className="analytics-radar-grid"
                          />
                        ))}

                        {lifeAreas.map((area, index) => {
                          const point = getPoint(index, 100);

                          return (
                            <line
                              key={area.name}
                              x1={center}
                              y1={center}
                              x2={point.x}
                              y2={point.y}
                              className="analytics-radar-axis"
                            />
                          );
                        })}

                        <polygon
                          points={radarPoints}
                          className="analytics-radar-shape"
                        />

                        {areaData.map((area, index) => {
                          const point = getPoint(
                            index,
                            area.score ?? 0
                          );

                          return (
                            <circle
                              key={area.name}
                              cx={point.x}
                              cy={point.y}
                              r="4.5"
                              fill={area.color}
                              stroke="#111b31"
                              strokeWidth="2"
                            />
                          );
                        })}

                        {lifeAreas.map((area, index) => {
                          const point = getPoint(index, 119);

                          return (
                            <text
                              key={area.name}
                              x={point.x}
                              y={point.y}
                              className="analytics-radar-label"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {area.name}
                            </text>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="analytics-radar-legend">
                      {areaData.map((area) => (
                        <div
                          className="analytics-radar-legend-item"
                          key={area.name}
                        >
                          <span
                            className="analytics-area-dot"
                            style={{ background: area.color }}
                          />
                          <span className="analytics-radar-area-name">
                            {area.name}
                          </span>
                          <strong>
                            {area.score === null
                              ? "Not tracked"
                              : `${area.score}%`}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Strongest and weakest areas */}
              <section className="analytics-content-grid">
                <article className="analytics-card">
                  <p className="analytics-metric-label">
                    CURRENT STRENGTH
                  </p>
                  <h2>
                    {strongestArea
                      ? strongestArea.name
                      : "Awaiting data"}
                  </h2>
                  <p className="analytics-card-description">
                    {strongestArea
                      ? `${strongestArea.score}% average progress across ${strongestArea.goalCount} goals. Keep building on this momentum.`
                      : "Add goals to discover your strongest area."}
                  </p>
                </article>

                <article className="analytics-card">
                  <p className="analytics-metric-label">
                    OPPORTUNITY TO GROW
                  </p>
                  <h2>
                    {weakestArea
                      ? weakestArea.name
                      : "Awaiting data"}
                  </h2>
                  <p className="analytics-card-description">
                    {weakestArea
                      ? `${weakestArea.score}% average progress. Consider choosing one manageable next step in this area.`
                      : "Add goals to identify areas that may need more attention."}
                  </p>
                </article>
              </section>

              <p className="analytics-footnote">
                Life balance reflects average progress across tracked
                goals. It is a planning indicator, not a measure of
                personal wellbeing.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}