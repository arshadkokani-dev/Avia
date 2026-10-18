import "./analytics.css";

export default function AnalyticsPage() {
  return (
    <main className="avia-app analytics-app">

      <section className="avia-main analytics-main">
        <div className="analytics-page">
          <header className="analytics-header">
            <div>
              <p className="analytics-eyebrow">YOUR PERSONAL LIFE OS</p>

              <h1 className="analytics-title">Analytics</h1>

              <p className="analytics-description">
                Understand your progress across the areas that matter to you.
                Discover patterns and make better-informed decisions.
              </p>
            </div>
          </header>

          <section className="analytics-summary-grid">
            <article className="analytics-card">
              <p className="analytics-metric-label">GOALS TRACKED</p>
              <h2 className="analytics-metric">Your goals</h2>
              <p className="analytics-card-description">
                Your progress will appear here as you track your goals.
              </p>
            </article>

            <article className="analytics-card">
              <p className="analytics-metric-label">LIFE DIMENSIONS</p>
              <h2 className="analytics-metric">7 areas</h2>
              <p className="analytics-card-description">
                Fitness, learning, nutrition, habits, career, relationships,
                and recovery.
              </p>
            </article>

            <article className="analytics-card">
              <p className="analytics-metric-label">YOUR NEXT STEP</p>
              <h2 className="analytics-metric">Keep going</h2>
              <p className="analytics-card-description">
                Track your goals consistently to build a useful progress
                history.
              </p>
            </article>
          </section>

          <section className="analytics-content-grid">
            <article className="analytics-card">
              <h2>Your progress over time</h2>

              <p className="analytics-card-description">
                Historical trends will appear here when progress history is
                available.
              </p>

              <div className="analytics-empty-state">
                <div>
                  <h3>Your progress story starts here</h3>
                  <p>
                    Continue tracking your goals to build a meaningful picture
                    of your progress.
                  </p>
                </div>
              </div>
            </article>

            <article className="analytics-card">
              <h2>Life balance</h2>

              <p className="analytics-card-description">
                Compare progress across the areas of your life.
              </p>

              <div className="analytics-insight">
                <p>
                  Your life-area analysis will become more informative as you
                  add goals and track your progress.
                </p>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}