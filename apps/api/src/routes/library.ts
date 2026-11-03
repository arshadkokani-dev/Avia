import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

function getUserId(req: AuthenticatedRequest) {
  return req.userId;
}

// Get the current user's saved resources
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const resources = await prisma.libraryResource.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(resources);
  } catch (error) {
    console.error("Library fetch error:", error);
    res.status(500).json({ error: "Failed to fetch resources." });
  }
});

// Save a resource
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, url, category, description } = req.body;

    if (!title?.trim() || !url?.trim()) {
      res.status(400).json({ error: "Title and URL are required." });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "Enter a valid URL." });
      return;
    }

    const resource = await prisma.libraryResource.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        category: category?.trim() || "General",
        description: description?.trim() || null,
        userId,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Library create error:", error);
    res.status(500).json({ error: "Failed to save resource." });
  }
});

// Delete a saved resource
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await prisma.libraryResource.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Resource not found." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Library delete error:", error);
    res.status(500).json({ error: "Failed to delete resource." });
  }
});

export default router;