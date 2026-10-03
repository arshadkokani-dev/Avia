import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { userId, title, description } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        error: "userId and title are required",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
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

router.get("/", async (_req, res) => {
  try {
    const goals = await prisma.goal.findMany({
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