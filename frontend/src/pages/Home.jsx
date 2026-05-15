import { useEffect, useState } from "react";
import { api } from "../api";

export default function Home() {
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initial load = all properties.
  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.searchProperties({
        location: location.trim(),
        min_price: minPrice,
        max_price: maxPrice,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hf-hero" data-testid="hero">
        <h1>Find a place that feels like home.</h1>
        <p>
          Browse listings near your campus. Filter by location and budget — search
          is powered by parameterised queries to keep things safe.
        </p>

        <form className="hf-search" onSubmit={search} data-testid="search-form">
          <input
            className="hf-input"
            placeholder="Location (e.g. Berlin)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            data-testid="search-location"
          />
          <input
            className="hf-input"
            type="number"
            min="0"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            data-testid="search-min-price"
          />
          <input
            className="hf-input"
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            data-testid="search-max-price"
          />
          <button
            className="hf-btn"
            type="submit"
            disabled={loading}
            data-testid="search-submit"
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            className="hf-btn hf-btn-secondary"
            onClick={() => {
              setLocation("");
              setMinPrice("");
              setMaxPrice("");
              setTimeout(() => search(), 0);
            }}
            data-testid="search-clear"
          >
            Clear
          </button>
        </form>
      </section>

      {error && (
        <div className="hf-error" data-testid="search-error">
          {error}
        </div>
      )}

      <div className="hf-result-count" data-testid="result-count">
        {results.length} {results.length === 1 ? "property" : "properties"} found
      </div>

      {results.length === 0 && !loading ? (
        <div className="hf-empty" data-testid="empty-state">
          No properties match your filters. Try widening your search.
        </div>
      ) : (
        <div className="hf-grid" data-testid="property-grid">
          {results.map((p) => (
            <article
              key={p.propertyID}
              className="hf-card"
              data-testid={`property-card-${p.propertyID}`}
            >
              <img src={p.image_url} alt={p.title} />
              <div className="hf-card-body">
                <h3 className="hf-card-title">{p.title}</h3>
                <div className="hf-card-loc">{p.location}</div>
                <div className="hf-card-price">
                  €{Number(p.price).toLocaleString()}/mo
                </div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                  {p.description}
                </p>
                <div className="hf-card-meta">
                  <span>{p.bedrooms} bd</span>
                  <span>{p.bathrooms} ba</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
