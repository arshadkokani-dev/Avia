import express from "express";
import cors from "cors";

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

app.listen(PORT, () => {
  console.log(`Avia API running on http://localhost:${PORT}`);
});