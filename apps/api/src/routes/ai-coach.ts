import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";

const router = Router();

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getUserId(req: AuthenticatedRequest): string {
  return req.userId!;
}

// Send a conversation to Groq
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey || !model) {
      res.status(500).json({
        error: "AI Coach is not configured. Check GROQ_API_KEY and GROQ_MODEL.",
      });
      return;
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "At least one message is required." });
      return;
    }

    if (messages.length > 20) {
      res.status(400).json({ error: "Please start a new conversation." });
      return;
    }

    const validMessages = messages.every(
      (message: ChatMessage) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 4000
    );

    if (!validMessages) {
      res.status(400).json({ error: "Invalid conversation messages." });
      return;
    }

    // Keep only recent messages to limit request size
    const conversation = (messages as ChatMessage[]).slice(-12);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are AVIA Coach, a practical and supportive personal growth assistant. Help users with goals, habits, planning, learning, fitness, recovery and reflection. Give realistic, actionable advice. Ask focused questions when context is missing. Never claim to know personal data that was not provided. Do not encourage sacrificing sleep or recovery. You are not a medical professional; encourage appropriate professional help for medical or mental health concerns.",
            },
            ...conversation,
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error("Groq API error:", response.status, errorBody);

      res.status(response.status === 429 ? 429 : 502).json({
        error:
          response.status === 429
            ? "The AI Coach is busy. Please try again shortly."
            : "The AI Coach couldn't generate a response. Please try again.",
      });
      return;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      res.status(502).json({ error: "The AI returned an empty response." });
      return;
    }

    // The authenticated user is verified by requireAuth.
    void getUserId(req);

    res.json({ reply });
  } catch (error) {
    console.error("AI Coach error:", error);
    res.status(500).json({ error: "Something went wrong with AI Coach." });
  }
});

export default router;