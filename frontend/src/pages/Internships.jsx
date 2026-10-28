import { useEffect, useState } from "react";
import InternshipCard from "../components/InternshipCard";
import { useApi } from "../hooks/useApi";
import { useSavedInternships } from "../hooks/useSavedInternships";
import { FIELDS, TYPES } from "../utils/format";

const PAGE_SIZE = 9;

export default function Internships() {
  const [filters, setFilters] = useState({
    search: "",
    field: "",
    type: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const saved = useSavedInternships();

  // Wait until the user stops typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query = new URLSearchParams({
    status: "Open",
    sort: filters.sort,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
  if (filters.field) query.set("field", filters.field);
  if (filters.type) query.set("type", filters.type);

  const { data, loading, error } = useApi(`/internships?${query}`);
  const internships = data?.data ?? [];
  const pagination = data?.pagination;

  function setFilter(name, value) {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ search: "", field: "", type: "", sort: "newest" });
    setPage(1);
  }

  async function handleToggleSave(id) {
    setActionError("");
    try {
      await saved.toggle(id);
    } catch (err) {
      setActionError(err.message);
    }
  }

  const hasFilters = filters.search || filters.field || filters.type;

  return (
    <main className="content" id="internships">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OPPORTUNITIES</span>
          <h2>Explore internships</h2>
          <p>Find a role that matches your interests.</p>
        </div>
        <span className="count">
          {pagination ? `${pagination.total} opportunities` : "Loading..."}
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search"
          type="search"
          placeholder="Search by title, company, skill or location..."
          aria-label="Search internships"
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
        />
        <select
          aria-label="Field"
          value={filters.field}
          onChange={(event) => setFilter("field", event.target.value)}
        >
          <option value="">All fields</option>
          {FIELDS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Internship type"
          value={filters.type}
          onChange={(event) => setFilter("type", event.target.value)}
        >
          <option value="">All types</option>
          {TYPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          value={filters.sort}
          onChange={(event) => setFilter("sort", event.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="deadline">Closing soonest</option>
          <option value="stipendHigh">Highest stipend</option>
        </select>
      </div>

      {(error || actionError || saved.error) && (
        <div className="notice error">{error || actionError || saved.error}</div>
      )}

      {loading && !data ? (
        <p className="empty-state">Loading internships...</p>
      ) : internships.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-icon">⌕</span>
          <h3>No internships found</h3>
          <p>{hasFilters ? "Try different filters." : "There are no open internships yet."}</p>
          {hasFilters && (
            <button className="secondary-button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={`internship-grid ${loading ? "is-loading" : ""}`}>
          {internships.map((item) => (
            <InternshipCard
              key={item._id}
              item={item}
              saved={saved.ids.has(item._id)}
              onToggleSave={saved.isStudent ? handleToggleSave : undefined}
            />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="secondary-button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            ← Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="secondary-button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
