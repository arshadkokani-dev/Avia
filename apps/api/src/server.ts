import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import goalsRouter from "./routes/goals.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.json({
    service: "Avia API",
    status: "running",
  });
});

app.use("/api", healthRouter);
app.use("/api/goals", goalsRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Avia API running on http://localhost:${PORT}`);
});