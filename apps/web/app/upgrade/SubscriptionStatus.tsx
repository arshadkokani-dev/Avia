"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type SubscriptionData = {
  subscription: {
    plan: "FREE" | "PRO";
    status: "FREE" | "ACTIVE" | "CANCELLED" | "EXPIRED";
    currentPeriodEnd: string | null;
  };
  hasProAccess: boolean;
};

export default function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<SubscriptionData>("/subscription/me")
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load subscription."
        );
      });
  }, []);

  if (error) {
    return (
      <div className="upgrade-status-message" role="alert">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="upgrade-status-message">
        Loading your subscription...
      </div>
    );
  }

  const { subscription, hasProAccess } = data;

  return (
    <div className="upgrade-status-message">
      <div>
        <strong>
          Current plan: {subscription.plan === "PRO" ? "AVIA Pro" : "AVIA Free"}
        </strong>

        <p>
          {hasProAccess
            ? "Your Pro subscription is currently active."
            : subscription.status === "CANCELLED"
              ? "Your subscription is cancelled or no longer active."
              : subscription.status === "EXPIRED"
                ? "Your previous subscription has expired."
                : "You are currently using the Free plan."}
        </p>
      </div>

      <span className={hasProAccess ? "upgrade-status-pro" : ""}>
        {subscription.status}
      </span>
    </div>
  );
}