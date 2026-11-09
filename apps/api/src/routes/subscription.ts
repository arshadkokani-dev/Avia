import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { PLAN_CATALOG } from "../config/plans.js";

const router = Router();

function getUserId(req: AuthenticatedRequest): string {
  return req.userId!;
}

// Calculate whether the subscription currently grants Pro access.
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

// Return the authenticated user's subscription and available plans.
router.get("/me", requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.upsert({
      where: {
        userId: getUserId(req),
      },
      update: {},
      create: {
        userId: getUserId(req),
      },
    });

    res.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      hasProAccess: hasProAccess(subscription),
      plans: PLAN_CATALOG,
    });
  } catch (error) {
    console.error("Subscription retrieval error:", error);
    res.status(500).json({
      error: "Unable to retrieve subscription information.",
    });
  }
});

export default router;