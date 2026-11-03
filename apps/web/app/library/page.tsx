"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import "./library.css";

type Resource = {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string | null;
  createdAt: string;
};

const categories = [
  "General",
  "Learning",
  "Career",
  "Fitness",
  "Nutrition",
  "Recovery",
];

export default function LibraryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadResources = useCallback(async () => {
    try {
      setError("");
      const data = await apiRequest<Resource[]>("/library");
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesCategory =
        filter === "All" || resource.category === filter;
      const query = search.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.url.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [resources, filter, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest<Resource>("/library", {
        method: "POST",
        body: JSON.stringify({ title, url, category, description }),
      });

      setTitle("");
      setUrl("");
      setCategory("General");
      setDescription("");
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save resource.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/library/${id}`, { method: "DELETE" });
      setResources((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete resource.");
    }
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <div>
          <span className="library-eyebrow">YOUR KNOWLEDGE SPACE</span>
          <h1>Library</h1>
          <p>Save useful resources. Keep valuable knowledge within reach.</p>
        </div>
        <div className="library-count">
          <strong>{resources.length}</strong>
          <span>Saved resources</span>
        </div>
      </header>

      <section className="library-form-card">
        <div className="library-section-heading">
          <div>
            <h2>Add a resource</h2>
            <p>Keep articles, tools and learning material in one place.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="library-form">
          <label>
            Resource title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React documentation"
              maxLength={120}
              required
            />
          </label>

          <label>
            Resource URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Note <span className="library-optional">(optional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this useful?"
              maxLength={500}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "+ Save resource"}
          </button>
        </form>
      </section>

      <section className="library-resources">
        <div className="library-section-heading">
          <div>
            <h2>Your resources</h2>
            <p>Everything you've chosen to keep.</p>
          </div>
          <input
            className="library-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            aria-label="Search resources"
          />
        </div>

        <div className="library-filters">
          {["All", ...categories].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        {error && <p className="library-error">{error}</p>}

        {loading ? (
          <p className="library-empty">Loading your library...</p>
        ) : filteredResources.length === 0 ? (
          <div className="library-empty">
            <span>▤</span>
            <h3>{resources.length ? "No matching resources" : "Your library is empty"}</h3>
            <p>
              {resources.length
                ? "Try another search or category."
                : "Save your first useful link using the form above."}
            </p>
          </div>
        ) : (
          <div className="library-grid">
            {filteredResources.map((resource) => (
              <article className="library-resource-card" key={resource.id}>
                <div className="library-resource-top">
                  <span className="library-category">{resource.category}</span>
                  <button
                    type="button"
                    className="library-delete"
                    onClick={() => void handleDelete(resource.id)}
                    aria-label={`Delete ${resource.title}`}
                  >
                    ×
                  </button>
                </div>

                <h3>{resource.title}</h3>
                {resource.description && <p>{resource.description}</p>}

                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  Open resource ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}