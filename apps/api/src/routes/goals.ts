import { Router } from "express";
import {
  GoalFrequency,
  GoalStatus,
  GoalType,
  TrackingMode,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const areas = [
  "Fitness",
  "Learning",
  "Nutrition",
  "Habits",
  "Career",
  "Relationships",
  "Recovery",
];

// Use UTC calendar boundaries for consistent daily and weekly records.
function getPeriodStart(frequency: GoalFrequency): Date {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (frequency === GoalFrequency.WEEKLY) {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  }

  return start;
}

function parseGoalConfiguration(body: Record<string, unknown>) {
  const {
    title,
    description,
    area,
    type,
    frequency,
    targetDate,
    progress,
    trackingMode,
    dailyTarget,
    unit,
  } = body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 100
  ) {
    throw new Error("Title must contain between 1 and 100 characters.");
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    throw new Error("Description must be a string.");
  }

  if (
    area !== undefined &&
    (typeof area !== "string" || !areas.includes(area))
  ) {
    throw new Error("Invalid life area.");
  }

  if (
    type !== undefined &&
    !["milestone", "recurring"].includes(String(type))
  ) {
    throw new Error("Invalid goal type.");
  }

  const goalType =
    type === "recurring" ? GoalType.RECURRING : GoalType.MILESTONE;

  let parsedDate: Date | null = null;

  if (targetDate !== undefined && targetDate !== null && targetDate !== "") {
    if (
      typeof targetDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ) {
      throw new Error("Target date must use YYYY-MM-DD format.");
    }

    parsedDate = new Date(`${targetDate}T00:00:00.000Z`);

    // Reject invalid dates, including dates that JavaScript normalizes.
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== targetDate
    ) {
      throw new Error("Invalid target date.");
    }
  }

  if (goalType === GoalType.MILESTONE && !parsedDate) {
    throw new Error("Milestone goals require a target date.");
  }

  let parsedFrequency: GoalFrequency | null = null;
  let parsedMode: TrackingMode | null = null;
  let parsedTarget: number | null = null;
  let parsedUnit: string | null = null;

  if (goalType === GoalType.RECURRING) {
    if (!["daily", "weekly"].includes(String(frequency))) {
      throw new Error("Recurring goals require a daily or weekly frequency.");
    }

    parsedFrequency =
      frequency === "weekly"
        ? GoalFrequency.WEEKLY
        : GoalFrequency.DAILY;

    if (!["quantity", "completion"].includes(String(trackingMode))) {
      throw new Error("Invalid tracking mode.");
    }

    parsedMode =
      trackingMode === "quantity"
        ? TrackingMode.QUANTITY
        : TrackingMode.COMPLETION;

    if (parsedMode === TrackingMode.QUANTITY) {
      parsedTarget = Number(dailyTarget);

      if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
        throw new Error("Quantity targets must be greater than zero.");
      }

      if (
        typeof unit !== "string" ||
        !unit.trim() ||
        unit.trim().length > 30
      ) {
        throw new Error("A valid unit is required for quantity tracking.");
      }

      parsedUnit = unit.trim();
    }
  }

  const parsedProgress = progress === undefined ? 0 : Number(progress);

  if (
    !Number.isInteger(parsedProgress) ||
    parsedProgress < 0 ||
    parsedProgress > 100
  ) {
    throw new Error("Progress must be an integer between 0 and 100.");
  }

  return {
    title: title.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    area: typeof area === "string" ? area : "Learning",
    type: goalType,
    frequency: parsedFrequency,
    targetDate: goalType === GoalType.MILESTONE ? parsedDate : null,
    progress: parsedProgress,
    trackingMode: parsedMode,
    dailyTarget: parsedTarget,
    unit: parsedUnit,
  };
}

// Create a goal and its initial milestone snapshot atomically.
router.post("/", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const data = parseGoalConfiguration(req.body);

    const goal = await prisma.$transaction(async (tx) => {
      const createdGoal = await tx.goal.create({
        data: {
          ...data,
          userId: authReq.userId!,
        },
      });

      // Recurring goals use period-based tracking, not milestone snapshots.
      if (createdGoal.type === GoalType.MILESTONE) {
        await tx.goalProgressHistory.create({
          data: {
            goalId: createdGoal.id,
            progress: createdGoal.progress,
          },
        });
      }

      return tx.goal.findUniqueOrThrow({
        where: { id: createdGoal.id },
        include: {
          trackingRecords: true,
          progressHistory: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return res.status(201).json(goal);
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("Prisma") &&
      !error.message.includes("Unique constraint")
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to create goal:", error);
    return res.status(500).json({ error: "Failed to create goal" });
  }
});

// List only the authenticated user's goals.
router.get("/", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        error: "page must be positive and limit must be between 1 and 50",
      });
    }

    const where = { userId: authReq.userId };

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include: {
          trackingRecords: true,
          progressHistory: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.goal.count({ where }),
    ]);

    return res.json({
      data: goals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    return res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// Fetch one goal, including its tracking and milestone history.
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: String(req.params.id),
        userId: authReq.userId,
      },
      include: {
        trackingRecords: true,
        progressHistory: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    return res.json(goal);
  } catch (error) {
    console.error("Failed to fetch goal:", error);
    return res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// Update a goal and save a snapshot when milestone progress changes.
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = String(req.params.id);

    const existing = await prisma.goal.findFirst({
      where: {
        id,
        userId: authReq.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const { title, description, status, progress } = req.body;

    if (status !== undefined && !Object.values(GoalStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid goal status." });
    }

    const data: {
      title?: string;
      description?: string | null;
      status?: GoalStatus;
      progress?: number;
    } = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        return res.status(400).json({
          error: "Title must contain between 1 and 100 characters.",
        });
      }

      data.title = title.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return res.status(400).json({ error: "Description must be a string." });
      }

      data.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }

    if (status !== undefined) {
      data.status = status as GoalStatus;
    }

    if (progress !== undefined) {
      const value = Number(progress);

      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return res.status(400).json({
          error: "Progress must be an integer between 0 and 100.",
        });
      }

      data.progress = value;
    }

    const goal = await prisma.$transaction(async (tx) => {
      const updatedGoal = await tx.goal.update({
        where: { id },
        data,
      });

      // Only milestone goals use this percentage-based history.
      if (
        existing.type === GoalType.MILESTONE &&
        typeof data.progress === "number" &&
        data.progress !== existing.progress
      ) {
        await tx.goalProgressHistory.create({
          data: {
            goalId: id,
            progress: updatedGoal.progress,
          },
        });
      }

      return tx.goal.findUniqueOrThrow({
        where: { id },
        include: {
          trackingRecords: true,
          progressHistory: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return res.json(goal);
  } catch (error) {
    console.error("Failed to update goal:", error);
    return res.status(500).json({ error: "Failed to update goal" });
  }
});

// Save quantity or completion for the current recurring tracking period.
router.put("/:id/tracking", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: String(req.params.id),
        userId: authReq.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (
      goal.type !== GoalType.RECURRING ||
      !goal.frequency ||
      !goal.trackingMode
    ) {
      return res.status(400).json({
        error: "This goal does not support recurring tracking.",
      });
    }

    const { amount, completed } = req.body;

    if (goal.trackingMode === TrackingMode.QUANTITY) {
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        return res.status(400).json({
          error: "Amount must be a non-negative number.",
        });
      }
    }

    if (
      goal.trackingMode === TrackingMode.COMPLETION &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        error: "Completed must be a boolean.",
      });
    }

    const periodStart = getPeriodStart(goal.frequency);

    const record = await prisma.goalTracking.upsert({
      where: {
        goalId_periodStart: {
          goalId: goal.id,
          periodStart,
        },
      },
      create: {
        goalId: goal.id,
        periodStart,
        amount:
          goal.trackingMode === TrackingMode.QUANTITY ? amount : 0,
        completed:
          goal.trackingMode === TrackingMode.COMPLETION ? completed : false,
      },
      update:
        goal.trackingMode === TrackingMode.QUANTITY
          ? { amount }
          : { completed },
    });

    return res.json(record);
  } catch (error) {
    console.error("Failed to save tracking record:", error);
    return res.status(500).json({ error: "Failed to save tracking record" });
  }
});

// Delete only a goal owned by the authenticated user.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const existing = await prisma.goal.findFirst({
      where: {
        id: String(req.params.id),
        userId: authReq.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({
      where: { id: existing.id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;