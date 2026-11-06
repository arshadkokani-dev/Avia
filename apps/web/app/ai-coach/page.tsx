"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import "./ai-coach.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
};

type SendResponse = {
  userMessage: Message;
  assistantMessage: Message;
};

const suggestions = [
  "Review my current goals and suggest what to prioritize.",
  "Help me create a realistic plan for tomorrow.",
  "How can I improve my habit consistency?",
  "Analyze my recent progress and suggest improvements.",
];

export default function AICoachPage() {
  const [tab, setTab] = useState<"chat" | "history">("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [includeJournal, setIncludeJournal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiRequest<Conversation[]>("/ai-coach/conversations");
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load conversation history."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const openConversation = async (id: string) => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<Message[]>(
        `/ai-coach/conversations/${id}/messages`
      );

      setMessages(data);
      setActiveId(id);
      setTab("chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open conversation.");
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setError("");
    setTab("chat");
  };

  const sendMessage = async (
    event?: FormEvent<HTMLFormElement>,
    suggestedMessage?: string
  ) => {
    event?.preventDefault();

    const content = (suggestedMessage ?? input).trim();

    if (!content || loading) return;

    setLoading(true);
    setError("");
    setInput("");

    try {
      let conversationId = activeId;

      if (!conversationId) {
        const created = await apiRequest<{ id: string }>(
          "/ai-coach/conversations",
          {
            method: "POST",
            body: JSON.stringify({
              title: content.slice(0, 50),
            }),
          }
        );

        conversationId = created.id;
        setActiveId(created.id);
      }

      const result = await apiRequest<SendResponse>(
        `/ai-coach/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content,
            includeJournal,
          }),
        }
      );

      setMessages((current) => [
        ...current,
        result.userMessage,
        result.assistantMessage,
      ]);

      await loadConversations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send your message."
      );
      // Keep the draft available for another attempt.
      setInput(content);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm("Delete this conversation permanently?")) return;

    try {
      await apiRequest(`/ai-coach/conversations/${id}`, {
        method: "DELETE",
      });

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id)
      );

      if (activeId === id) {
        startNewChat();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete conversation."
      );
    }
  };

  return (
    <main className="coach-page">
      <header className="coach-header">
        <div className="coach-heading">
          <div className="coach-icon">✧</div>
          <div>
            <span className="coach-eyebrow">YOUR PERSONAL GROWTH COMPANION</span>
            <h1>AI Coach</h1>
            <p>Understand your progress. Make better decisions.</p>
          </div>
        </div>

        <button
          className="coach-new-chat"
          type="button"
          onClick={startNewChat}
          disabled={loading}
        >
          + New chat
        </button>
      </header>

      <nav className="coach-tabs">
        <button
          type="button"
          className={tab === "chat" ? "active" : ""}
          onClick={() => setTab("chat")}
        >
          <span>✧</span> Chat
        </button>

        <button
          type="button"
          className={tab === "history" ? "active" : ""}
          onClick={() => {
            setTab("history");
            void loadConversations();
          }}
        >
          <span>◷</span> History
          <span className="coach-history-count">{conversations.length}</span>
        </button>
      </nav>

      {error && (
        <div className="coach-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {tab === "history" ? (
        <section className="coach-history">
          <div className="coach-section-heading">
            <div>
              <h2>Your conversations</h2>
              <p>Continue where you left off.</p>
            </div>
            <button type="button" onClick={startNewChat}>+ New chat</button>
          </div>

          {loadingHistory ? (
            <div className="coach-empty">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="coach-empty">
              <span>◷</span>
              <h3>No conversations yet</h3>
              <p>Your saved conversations will appear here.</p>
            </div>
          ) : (
            <div className="coach-history-list">
              {conversations.map((conversation) => (
                <article className="coach-history-item" key={conversation.id}>
                  <button
                    className="coach-history-open"
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                  >
                    <span className="coach-history-icon">✧</span>
                    <span className="coach-history-details">
                      <strong>{conversation.title}</strong>
                      <small>
                        {conversation.messages[0]?.content || "No messages yet"}
                      </small>
                      <small>
                        {new Date(conversation.updatedAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </small>
                    </span>
                  </button>

                  <button
                    className="coach-delete"
                    type="button"
                    onClick={() => void deleteConversation(conversation.id)}
                    aria-label={`Delete ${conversation.title}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="coach-chat">
          <div className="coach-messages">
            {messages.length === 0 ? (
              <div className="coach-welcome">
                <div className="coach-welcome-icon">✧</div>
                <h2>What would you like to work on?</h2>
                <p>
                  Your coach can use your AVIA goals, habits and plans to give
                  more relevant guidance.
                </p>

                <div className="coach-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={loading}
                      onClick={() => void sendMessage(undefined, suggestion)}
                    >
                      {suggestion}
                      <span>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  className={`coach-message coach-message--${message.role}`}
                  key={message.id}
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
          </div>

          <div className="coach-permission">
            <label>
              <input
                type="checkbox"
                checked={includeJournal}
                onChange={(event) => setIncludeJournal(event.target.checked)}
                disabled={loading}
              />
              Allow this message to use my recent journal entries
            </label>
            <span>Off by default</span>
          </div>

          <form
            className="coach-input-area"
            onSubmit={(event) => void sendMessage(event)}
          >
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
      )}

      <p className="coach-disclaimer">
        AI Coach can make mistakes. Use your judgment for important decisions.
      </p>
    </main>
  );
}