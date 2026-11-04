import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

function getUserId(req: AuthenticatedRequest): string {
  return req.userId!;
}

// Get the user's journal entries
router.get("/", requireAuth, async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: getUserId(req) },
      orderBy: { updatedAt: "desc" },
    });

    res.json(entries);
  } catch (error) {
    console.error("Journal fetch error:", error);
    res.status(500).json({ error: "Failed to fetch journal entries." });
  }
});

// Create a journal entry
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content, mood } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Journal content is required." });
      return;
    }

    const entry = await prisma.journalEntry.create({
      data: {
        title: typeof title === "string" && title.trim()
          ? title.trim()
          : "My journal entry",
        content: content.trim(),
        mood: typeof mood === "string" && mood.trim() ? mood : null,
        userId: getUserId(req),
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Journal create error:", error);
    res.status(500).json({ error: "Failed to save journal entry." });
  }
});

// Update an existing entry
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const userId = getUserId(req);
    const { title, content, mood } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Journal content is required." });
      return;
    }

    const result = await prisma.journalEntry.updateMany({
      where: { id, userId },
      data: {
        title: typeof title === "string" && title.trim()
          ? title.trim()
          : "My journal entry",
        content: content.trim(),
        mood: typeof mood === "string" && mood.trim() ? mood : null,
      },
    });

    if (!result.count) {
      res.status(404).json({ error: "Journal entry not found." });
      return;
    }

    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId },
    });

    res.json(entry);
  } catch (error) {
    console.error("Journal update error:", error);
    res.status(500).json({ error: "Failed to update journal entry." });
  }
});

// Delete an entry
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await prisma.journalEntry.deleteMany({
      where: {
        id: String(req.params.id),
        userId: getUserId(req),
      },
    });

    if (!result.count) {
      res.status(404).json({ error: "Journal entry not found." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Journal delete error:", error);
    res.status(500).json({ error: "Failed to delete journal entry." });
  }
});

export default router;