// Check whether a subscription currently grants Pro access.
export function hasProAccess(subscription: {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
} | null): boolean {
  if (!subscription || subscription.plan !== "PRO") {
    return false;
  }

  const now = new Date();

  if (subscription.status === "ACTIVE") {
    return (
      !subscription.currentPeriodEnd ||
      subscription.currentPeriodEnd > now
    );
  }

  if (subscription.status === "CANCELLED") {
    return (
      subscription.currentPeriodEnd !== null &&
      subscription.currentPeriodEnd > now
    );
  }

  return false;
}