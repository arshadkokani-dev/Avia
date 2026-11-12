import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRazorpay } from "../lib/razorpay.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import { PLAN_CATALOG } from "../config/plans.js";

const router = Router();

function getUserId(req: AuthenticatedRequest): string {
  return req.userId!;
}

// Check whether the subscription currently grants Pro access.
export function hasProAccess(subscription: {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
} | null): boolean {
  if (!subscription || subscription.plan !== "PRO") return false;

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
    const userId = getUserId(req);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {},
      create: { userId },
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
    console.error("Subscription fetch error:", error);
    res.status(500).json({ error: "Failed to fetch subscription." });
  }
});

// Create a Razorpay subscription for the authenticated user.
router.post("/create", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const interval = req.body?.interval;

    if (interval !== "monthly" && interval !== "annual") {
      res.status(400).json({
        error: "Choose either monthly or annual billing.",
      });
      return;
    }

    const existing = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existing && hasProAccess(existing)) {
      res.status(409).json({
        error: "You already have an active Pro subscription.",
      });
      return;
    }

    if (existing?.status === "PENDING") {
      res.status(409).json({
        error: "A subscription is already awaiting authorization.",
      });
      return;
    }

    const planId =
      interval === "monthly"
        ? process.env.RAZORPAY_MONTHLY_PLAN_ID
        : process.env.RAZORPAY_ANNUAL_PLAN_ID;

    if (!planId) {
      res.status(500).json({
        error: "The selected Razorpay plan is not configured.",
      });
      return;
    }

    const razorpay = getRazorpay();

    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: interval === "monthly" ? 120 : 10,
      quantity: 1,
      customer_notify: 0,
      notes: {
        userId,
        product: "AVIA Pro",
        billingInterval: interval,
      },
    });

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: "FREE",
        status: "PENDING",
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: planId,
        billingInterval: interval,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
      create: {
        userId,
        plan: "FREE",
        status: "PENDING",
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: planId,
        billingInterval: interval,
      },
    });

    res.status(201).json({
      message: "Subscription created. Complete authorization to continue.",
      subscriptionId: subscription.razorpaySubscriptionId,
      checkoutUrl: razorpaySubscription.short_url,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({
      error: "Failed to create subscription. Please try again.",
    });
  }
});

export default router;