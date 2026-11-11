import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { createAccessToken } from "../lib/auth.js";

const router = Router();

// Register a new account.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "name, email and password are required",
      });
    }

    if (typeof name !== "string" || typeof email !== "string") {
      return res.status(400).json({
        error: "name and email must be valid strings",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "password must be at least 8 characters",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({
        error: "name and email cannot be empty",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = await createAccessToken(user.id, user.email);

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Registration failed:", error);

    return res.status(500).json({
      error: "Registration failed",
    });
  }
});

// Authenticate an existing account.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "invalid email or password",
      });
    }

    const token = await createAccessToken(user.id, user.email);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  }
});

// Fetch the currently authenticated account.
router.get("/me", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: authReq.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Failed to fetch current user:", error);

    return res.status(500).json({
      error: "Failed to fetch current user",
    });
  }
});

// Update the authenticated user's profile name.
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        error: "A valid name is required",
      });
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      return res.status(400).json({
        error: "Name cannot be empty",
      });
    }

    if (normalizedName.length > 60) {
      return res.status(400).json({
        error: "Name cannot exceed 60 characters",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: authReq.userId,
      },
      data: {
        name: normalizedName,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

export default router;