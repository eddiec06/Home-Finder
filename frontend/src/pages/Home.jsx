import { useEffect, useState } from "react";
import { api } from "../api";

export default function Home() {
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [listingType, setListingType] = useState(""); // "" | "rent" | "sale"
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        listing_type: listingType,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(p) {
    const formatted = `€${Number(p.price).toLocaleString()}`;
    return p.listing_type === "sale" ? formatted : `${formatted}/mo`;
  }

  return (
    <>
      <section className="hf-hero" data-testid="hero">
        <h1>Find a place that feels like home.</h1>
        <p>
          Browse listings across Europe. Filter by location, type and budget —
          search is powered by parameterised queries to keep things safe.
        </p>

        <form className="hf-search" onSubmit={search} data-testid="search-form">
          <input
            className="hf-input"
            placeholder="Location (e.g. Berlin)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            data-testid="search-location"
          />
          <select
            className="hf-select"
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            data-testid="search-listing-type"
          >
            <option value="">Any type</option>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
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
              setListingType("");
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <h3 className="hf-card-title">{p.title}</h3>
                  <span
                    className={`hf-badge hf-badge--${p.listing_type === "sale" ? "sale" : "rent"}`}
                    data-testid={`badge-${p.propertyID}`}
                  >
                    {p.listing_type === "sale" ? "For sale" : "For rent"}
                  </span>
                </div>
                <div className="hf-card-loc">{p.location}</div>
                <div className="hf-card-price">{formatPrice(p)}</div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                  {p.description}
                </p>
                <div className="hf-card-meta">
                  <span>{p.bedrooms} bd</span>
                  <span>{p.bathrooms} ba</span>
                </div>
                {(p.contact_name || p.contact_email || p.contact_phone) && (
                  <div className="hf-contact" data-testid={`contact-${p.propertyID}`}>
                    {p.contact_name && <strong>{p.contact_name}</strong>}
                    {p.contact_email && (
                      <a href={`mailto:${p.contact_email}`}>{p.contact_email}</a>
                    )}
                    {p.contact_phone && (
                      <a href={`tel:${p.contact_phone.replace(/\s/g, "")}`}>
                        {p.contact_phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
