"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import "./journal.css";

type Entry = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
};

const moods = ["😊 Happy", "😌 Calm", "😐 Okay", "😔 Low", "😣 Stressed"];

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      setError("");
      const data = await apiRequest<Entry[]>("/journal");
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load journal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  function resetEditor() {
    setTitle("");
    setContent("");
    setMood("");
    setEditingId(null);
  }

  function startEditing(entry: Entry) {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    setError("");

    try {
      const payload = { title, content, mood };

      if (editingId) {
        await apiRequest(`/journal/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/journal", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetEditor();
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this journal entry?")) return;

    try {
      await apiRequest(`/journal/${id}`, { method: "DELETE" });
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (editingId === id) resetEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete entry.");
    }
  }

  const filteredEntries = entries.filter((entry) =>
    `${entry.title} ${entry.content} ${entry.mood || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="journal-page">
      <header className="journal-header">
        <div>
          <span className="journal-eyebrow">YOUR PRIVATE SPACE</span>
          <h1>My Journal</h1>
          <p>Pause, reflect and put your thoughts into words.</p>
        </div>
        <div className="journal-total">
          <strong>{entries.length}</strong>
          <span>Entries written</span>
        </div>
      </header>

      <section className="journal-editor">
        <h2>{editingId ? "Edit your reflection" : "How was your day?"}</h2>
        <p>There is no right or wrong way to write.</p>

        <form onSubmit={handleSave}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this entry a title (optional)"
            maxLength={120}
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            rows={7}
            required
          />

          <label className="journal-mood-label">How are you feeling?</label>
          <div className="journal-moods">
            {moods.map((item) => (
              <button
                key={item}
                type="button"
                className={mood === item ? "selected" : ""}
                onClick={() => setMood(mood === item ? "" : item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="journal-actions">
            {editingId && (
              <button type="button" className="journal-cancel" onClick={resetEditor}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving || !content.trim()}>
              {saving ? "Saving..." : editingId ? "Update entry" : "Save reflection"}
            </button>
          </div>
        </form>
      </section>

      <section className="journal-history">
        <div className="journal-history-heading">
          <div>
            <h2>Past reflections</h2>
            <p>Look back at the thoughts you've recorded.</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            aria-label="Search journal entries"
          />
        </div>

        {error && <p className="journal-error">{error}</p>}

        {loading ? (
          <p className="journal-empty">Loading your entries...</p>
        ) : filteredEntries.length === 0 ? (
          <div className="journal-empty">
            <span>✎</span>
            <h3>{entries.length ? "No matching entries" : "Your story starts here"}</h3>
            <p>
              {entries.length
                ? "Try a different search."
                : "Write your first reflection above."}
            </p>
          </div>
        ) : (
          <div className="journal-entry-list">
            {filteredEntries.map((entry) => (
              <article className="journal-entry" key={entry.id}>
                <div className="journal-entry-top">
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {entry.mood && <span className="journal-entry-mood">{entry.mood}</span>}
                </div>
                <h3>{entry.title}</h3>
                <p className="journal-entry-content">{entry.content}</p>
                <div className="journal-entry-actions">
                  <button type="button" onClick={() => startEditing(entry)}>Edit</button>
                  <button type="button" onClick={() => void handleDelete(entry.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}