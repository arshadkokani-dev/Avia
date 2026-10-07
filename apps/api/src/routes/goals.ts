import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { title, description } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "title is required and must be a non-empty string",
      });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        error: "title must be 100 characters or less",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        error: "description must be a string",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: authReq.userId,
        title,
        description,
      },
    });

    return res.status(201).json(goal);
  } catch (error) {
    console.error("Failed to create goal:", error);

    return res.status(500).json({
      error: "Failed to create goal",
    });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: String(req.params.id),
        userId: authReq.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    return res.json(goal);
  } catch (error) {
    console.error("Failed to fetch goal:", error);

    return res.status(500).json({
      error: "Failed to fetch goal",
    });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { title, description, status } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          error: "title must be a non-empty string",
        });
      }

      if (title.trim().length > 100) {
        return res.status(400).json({
          error: "title must be 100 characters or less",
        });
      }
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        error: "description must be a string",
      });
    }

    if (
      status !== undefined &&
      !["ACTIVE", "COMPLETED", "PAUSED"].includes(status)
    ) {
      return res.status(400).json({
        error: "invalid goal status",
      });
    }

    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: String(req.params.id),
        userId: authReq.userId,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    const goal = await prisma.goal.update({
      where: {
        id: existingGoal.id,
      },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description.trim() || null,
        }),
        ...(status !== undefined && { status }),
      },
    });

    return res.json(goal);
  } catch (error) {
    console.error("Failed to update goal:", error);

    return res.status(500).json({
      error: "Failed to update goal",
    });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: authReq.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(goals);
  } catch (error) {
    console.error("Failed to fetch goals:", error);

    return res.status(500).json({
      error: "Failed to fetch goals",
    });
  }
});

export default router;