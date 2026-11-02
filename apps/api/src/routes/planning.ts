import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

function parseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Invalid date.");
  }

  return date;
}

// Get the Monday that starts a calendar week.
function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getUTCDay();

  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));

  return start;
}

function getUserId(req: AuthenticatedRequest) {
  return req.userId;
}

// Find or create the user's weekly plan.
async function ensureWeeklyPlan(userId: string, date: Date) {
  const weekStart = getWeekStart(date);

  return prisma.weeklyPlan.upsert({
    where: {
      userId_weekStart: {
        userId,
        weekStart,
      },
    },
    create: {
      userId,
      weekStart,
    },
    update: {},
  });
}

// Fetch one week's tasks.
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const requestedDate = req.query.weekStart
      ? parseDate(req.query.weekStart)
      : new Date();

    const weekStart = getWeekStart(requestedDate);

    const plan = await prisma.weeklyPlan.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      include: {
        tasks: {
          orderBy: [
            { scheduledDate: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
    });

    return res.json({
      plan: plan ?? {
        weekStart,
        tasks: [],
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Date")) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to fetch weekly plan:", error);
    return res.status(500).json({ error: "Failed to fetch weekly plan." });
  }
});

// Create a task for a selected date.
router.post("/tasks", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { title, scheduledDate } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120
    ) {
      return res.status(400).json({
        error: "Task title must contain between 1 and 120 characters.",
      });
    }

    const date = parseDate(scheduledDate);
    const plan = await ensureWeeklyPlan(userId, date);

    const task = await prisma.plannedTask.create({
      data: {
        title: title.trim(),
        scheduledDate: date,
        weeklyPlanId: plan.id,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Date")) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to create planned task:", error);
    return res.status(500).json({ error: "Failed to create planned task." });
  }
});

// Update a task's title, date or completion status.
router.patch("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const id = String(req.params.id);

    const existing = await prisma.plannedTask.findFirst({
      where: {
        id,
        weeklyPlan: { userId },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Task not found." });
    }

    const { title, completed, scheduledDate } = req.body;

    const data: {
      title?: string;
      completed?: boolean;
      scheduledDate?: Date;
      weeklyPlanId?: string;
    } = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 120
      ) {
        return res.status(400).json({ error: "Invalid task title." });
      }

      data.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          error: "Completed must be a boolean.",
        });
      }

      data.completed = completed;
    }

    if (scheduledDate !== undefined) {
      const date = parseDate(scheduledDate);
      const plan = await ensureWeeklyPlan(userId, date);

      data.scheduledDate = date;
      data.weeklyPlanId = plan.id;
    }

    const task = await prisma.plannedTask.update({
      where: { id },
      data,
    });

    return res.json(task);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Date")) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to update planned task:", error);
    return res.status(500).json({ error: "Failed to update planned task." });
  }
});

// Delete a task belonging to the authenticated user.
router.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const task = await prisma.plannedTask.findFirst({
      where: {
        id: String(req.params.id),
        weeklyPlan: { userId },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    await prisma.plannedTask.delete({
      where: { id: task.id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete planned task:", error);
    return res.status(500).json({ error: "Failed to delete planned task." });
  }
});

export default router;