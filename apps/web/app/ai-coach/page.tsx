"use client";

import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import "./ai-coach.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Help me plan a productive day",
  "How can I stay consistent with my goals?",
  "Help me improve my daily routine",
  "How should I balance work and recovery?",
];

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    suggestedMessage?: string
  ) {
    event?.preventDefault();

    const content = (suggestedMessage ?? input).trim();

    if (!content || loading) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest<{ reply: string }>("/ai-coach/chat", {
        method: "POST",
        body: JSON.stringify({ messages: updatedMessages }),
      });

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't reach AI Coach."
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <main className="coach-page">
      <header className="coach-header">
        <div className="coach-heading">
          <div className="coach-icon">✧</div>
          <div>
            <span className="coach-eyebrow">YOUR PERSONAL GROWTH COMPANION</span>
            <h1>AI Coach</h1>
            <p>Think clearly. Make progress. Build a better routine.</p>
          </div>
        </div>

        <button
          className="coach-new-chat"
          type="button"
          onClick={startNewChat}
          disabled={loading || messages.length === 0}
        >
          + New chat
        </button>
      </header>

      <section className="coach-chat">
        <div className="coach-messages">
          {messages.length === 0 ? (
            <div className="coach-welcome">
              <div className="coach-welcome-icon">✧</div>
              <h2>What would you like to work on?</h2>
              <p>
                Ask me about your goals, habits, productivity, learning or
                building a healthier routine.
              </p>

              <div className="coach-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void sendMessage(undefined, suggestion)}
                  >
                    {suggestion}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                className={`coach-message coach-message--${message.role}`}
                key={index}
              >
                {message.role === "assistant" && (
                  <span className="coach-avatar">✧</span>
                )}
                <div className="coach-message-content">
                  {message.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="coach-message coach-message--assistant">
              <span className="coach-avatar">✧</span>
              <div className="coach-message-content coach-typing">
                Thinking...
              </div>
            </div>
          )}

          <div aria-live="polite">
            {error && (
              <div className="coach-error">
                {error}
                <button
                  type="button"
                  onClick={() => void sendMessage(undefined, messages[messages.length - 1]?.content)}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        <form className="coach-input-area" onSubmit={sendMessage}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask your coach anything..."
            rows={2}
            maxLength={4000}
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "↑"}
          </button>
          <span>Enter to send · Shift + Enter for a new line</span>
        </form>
      </section>

      <p className="coach-disclaimer">
        AI Coach can make mistakes. Use your judgment for important decisions.
      </p>
    </main>
  );
}