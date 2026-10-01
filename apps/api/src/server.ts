import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.json({
    service: "Avia API",
    status: "running",
  });
});

app.use("/api", healthRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Avia API running on http://localhost:${PORT}`);
});