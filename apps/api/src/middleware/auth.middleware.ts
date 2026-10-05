import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authorization.slice("Bearer ".length);

    const payload = await verifyAccessToken(token);

    if (!payload.sub) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    req.userId = payload.sub;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}