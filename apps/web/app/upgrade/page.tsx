import Link from "next/link";
import SubscriptionStatus from "./SubscriptionStatus";
import "./upgrade.css";

const proFeatures = [
  {
    title: "Advanced AI Coach",
    description:
      "Deeper personalized analysis, richer conversations and more advanced guidance.",
  },
  {
    title: "Life Intelligence",
    description:
      "More detailed insights into how your goals, habits, recovery and routines interact.",
  },
  {
    title: "Advanced Analytics",
    description:
      "Detailed progress reports, historical trends and personalized performance insights.",
  },
  {
    title: "Weekly AI Reports",
    description:
      "Understand your weekly progress, identify patterns and discover areas to improve.",
  },
];

export default function UpgradePage() {
  return (
    <main className="upgrade-page">
      <header className="upgrade-header">
        <Link href="/" className="upgrade-back">
          ← Back to dashboard
        </Link>

        <span className="upgrade-eyebrow">THE NEXT LEVEL OF AVIA</span>

        <h1>
          Make progress.
          <span> With more intelligence.</span>
        </h1>

        <p>
          AVIA Pro is being designed to help you understand your life
          more deeply and make better decisions with personalized AI.
        </p>
      </header>

      <SubscriptionStatus/>

      <section className="upgrade-plans">
        <article className="upgrade-plan-card">
          <div className="upgrade-plan-top">
            <div>
              <span className="upgrade-plan-label">START HERE</span>
              <h2>Free</h2>
              <p>Build your personal operating system.</p>
            </div>

            <span className="upgrade-current">Current plan</span>
          </div>

          <div className="upgrade-price">
            Free
          </div>

          <ul>
            <li>Goal management</li>
            <li>Habit tracking</li>
            <li>Weekly planning</li>
            <li>Life balance analytics</li>
            <li>Personal journal and library</li>
            <li>AI Coach access</li>
          </ul>

          <Link href="/" className="upgrade-free-button">
            Continue with Free
          </Link>
        </article>

        <article className="upgrade-plan-card upgrade-pro-card">
          <div className="upgrade-pro-glow" />

          <div className="upgrade-plan-top">
            <div>
              <span className="upgrade-plan-label">FOR DEEPER GROWTH</span>
              <h2>AVIA Pro <span>✦</span></h2>
              <p>More intelligence. More insight. Better decisions.</p>
            </div>

            <span className="upgrade-coming">Coming soon</span>
          </div>

          <div className="upgrade-price">
            <span>Pricing</span>
            <small>To be announced</small>
          </div>

          <ul>
            {proFeatures.map((feature) => (
              <li className="upgrade-feature" key={feature.title}>
                <span className="upgrade-check">✦</span>
                <span>
                  <strong>{feature.title}</strong>
                  <small>{feature.description}</small>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="upgrade-pro-button"
            disabled
          >
            Payments launching soon
          </button>

          <p className="upgrade-payment-note">
            Subscription and payment options will be available
            after the launch of AVIA Pro.
          </p>
        </article>
      </section>

      <section className="upgrade-footer">
        <span>✧</span>
        <h2>Build a better version of your everyday life.</h2>
        <p>
          Start with the essentials. Upgrade when you're ready for more.
        </p>
      </section>
    </main>
  );
}