import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    service: "Avia API",
    status: "ok",
  });
});

export default router;