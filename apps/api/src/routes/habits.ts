import { Router } from "express";
import {
  HabitFrequency,
  HabitStatus,
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

function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.userId;
}

// Normalize a date to UTC midnight so each habit has one entry per day.
function parseEntryDate(value: unknown): Date {
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

function parseHabit(body: Record<string, unknown>) {
  const { name, description, area, frequency, weeklyTarget, skill } = body;

  // Validate the optional skill association.
  if (
    skill !== undefined &&
    skill !== null &&
    (typeof skill !== "string" || skill.trim().length > 80)
  ) {
    throw new Error("Skill must be a string of at most 80 characters.");
  }

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    throw new Error("Habit name must contain between 1 and 100 characters.");
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 500)
  ) {
    throw new Error("Description must be a string of at most 500 characters.");
  }

  if (
    area !== undefined &&
    (typeof area !== "string" || !areas.includes(area))
  ) {
    throw new Error("Invalid life area.");
  }

  if (
    frequency !== undefined &&
    !["daily", "weekly"].includes(String(frequency))
  ) {
    throw new Error("Frequency must be daily or weekly.");
  }

  const parsedFrequency =
    frequency === "weekly"
      ? HabitFrequency.WEEKLY
      : HabitFrequency.DAILY;

  let parsedWeeklyTarget: number | null = null;

  if (parsedFrequency === HabitFrequency.WEEKLY) {
    parsedWeeklyTarget = Number(weeklyTarget);

    if (
      !Number.isInteger(parsedWeeklyTarget) ||
      parsedWeeklyTarget < 1 ||
      parsedWeeklyTarget > 7
    ) {
      throw new Error("Weekly target must be an integer between 1 and 7.");
    }
  }

  return {
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    area: typeof area === "string" ? area : "Habits",
    skill:
      typeof skill === "string" && skill.trim()
        ? skill.trim()
        : null,
    frequency: parsedFrequency,
    weeklyTarget: parsedWeeklyTarget,
  };
}

// Create a habit for the authenticated user.
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const data = parseHabit(req.body);

    const habit = await prisma.habit.create({
      data: {
        ...data,
        userId,
      },
      include: {
    entries: {
        where: {
        entryDate: {
            gte: new Date(
            Date.UTC(
                new Date().getUTCFullYear() - 1,
                new Date().getUTCMonth(),
                new Date().getUTCDate(),
            ),
            ),
        },
        },
        orderBy: { entryDate: "desc" },
     },
    },
    });

    return res.status(201).json(habit);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Habit name") ||
        error.message.startsWith("Description") ||
        error.message.startsWith("Invalid life area") ||
        error.message.startsWith("Frequency") ||
        error.message.startsWith("Weekly target")||
        error.message.startsWith("Skill"))
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to create habit:", error);
    return res.status(500).json({ error: "Failed to create habit." });
  }
});

// List the authenticated user's habits and recent history.
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        status: HabitStatus.ACTIVE,
      },
      include: {
        entries: {
          orderBy: { entryDate: "desc" },
          take: 90,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ data: habits });
  } catch (error) {
    console.error("Failed to fetch habits:", error);
    return res.status(500).json({ error: "Failed to fetch habits." });
  }
});

// Record or update a habit entry for a specific date.
router.put("/:id/entries", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const habitId = String(req.params.id);
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
        status: HabitStatus.ACTIVE,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: "Habit not found." });
    }

    const { date, completed, amount } = req.body;
    const entryDate = parseEntryDate(date);

    if (typeof completed !== "boolean") {
      return res.status(400).json({
        error: "Completed must be a boolean.",
      });
    }

    if (
      amount !== undefined &&
      amount !== null &&
      (typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0)
    ) {
      return res.status(400).json({
        error: "Amount must be a non-negative number.",
      });
    }

    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_entryDate: {
          habitId,
          entryDate,
        },
      },
      create: {
        habitId,
        entryDate,
        completed,
        amount: amount ?? null,
      },
      update: {
        completed,
        amount: amount ?? null,
      },
    });

    return res.json(entry);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Date")) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to save habit entry:", error);
    return res.status(500).json({ error: "Failed to save habit entry." });
  }
});

// Archive a habit without deleting its historical records.
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: String(req.params.id),
        userId,
        status: HabitStatus.ACTIVE,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: "Habit not found." });
    }

    await prisma.habit.update({
      where: { id: habit.id },
      data: { status: HabitStatus.ARCHIVED },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to archive habit:", error);
    return res.status(500).json({ error: "Failed to archive habit." });
  }
});

export default router;