import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { hasProAccess } from "../routes/subscription.js";

// Require a valid Pro subscription before accessing a premium route.
export async function requirePro(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: req.userId,
      },
    });

    if (!hasProAccess(subscription)) {
      res.status(403).json({
        error: "An active AVIA Pro subscription is required.",
        code: "PRO_REQUIRED",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Pro entitlement check error:", error);

    res.status(500).json({
      error: "Unable to verify subscription access.",
    });
  }
}