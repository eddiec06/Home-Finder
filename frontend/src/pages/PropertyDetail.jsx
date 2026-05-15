import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    api
      .getProperty(id)
      .then(setProperty)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="hf-empty" data-testid="detail-error">
        {error}
        <div style={{ marginTop: 12 }}>
          <Link to="/">← Back to browse</Link>
        </div>
      </div>
    );
  }
  if (!property) return <p>Loading…</p>;

  const priceLabel =
    property.listing_type === "sale"
      ? `€${Number(property.price).toLocaleString()}`
      : `€${Number(property.price).toLocaleString()}/mo`;

  return (
    <article data-testid="detail-page">
      <button
        className="hf-btn hf-btn-secondary"
        onClick={() => navigate(-1)}
        data-testid="detail-back"
        style={{ marginBottom: 16 }}
      >
        ← Back
      </button>

      <div className="hf-detail">
        <img
          src={property.image_url}
          alt={property.title}
          className="hf-detail-img"
        />

        <div className="hf-detail-body">
          <div className="hf-detail-head">
            <h1 className="hf-detail-title" data-testid="detail-title">
              {property.title}
            </h1>
            <span
              className={`hf-badge hf-badge--${
                property.listing_type === "sale" ? "sale" : "rent"
              }`}
              data-testid="detail-badge"
            >
              {property.listing_type === "sale" ? "For sale" : "For rent"}
            </span>
          </div>

          <div className="hf-detail-loc" data-testid="detail-location">
            {property.location}
          </div>
          <div className="hf-detail-price" data-testid="detail-price">
            {priceLabel}
          </div>

          <ul className="hf-detail-stats">
            <li>
              <strong>{property.bedrooms}</strong> Bedrooms
            </li>
            <li>
              <strong>{property.bathrooms}</strong> Bathrooms
            </li>
            <li>
              <strong>{property.listing_type === "sale" ? "Sale" : "Rental"}</strong>{" "}
              listing
            </li>
          </ul>

          <h3 className="hf-detail-section">About this place</h3>
          <p className="hf-detail-desc">{property.description}</p>

          <div className="hf-detail-cta">
            {!showContact ? (
              <button
                className="hf-btn"
                onClick={() => setShowContact(true)}
                data-testid="contact-owner-btn"
              >
                Contact the owner
              </button>
            ) : (
              <div className="hf-contact-card" data-testid="owner-contact-card">
                <div className="hf-contact-card-title">Owner contact</div>
                {property.contact_name ? (
                  <div className="hf-contact-card-row">
                    <span>Name</span>
                    <strong>{property.contact_name}</strong>
                  </div>
                ) : null}
                {property.contact_email ? (
                  <div className="hf-contact-card-row">
                    <span>Email</span>
                    <a
                      href={`mailto:${property.contact_email}`}
                      data-testid="owner-email"
                    >
                      {property.contact_email}
                    </a>
                  </div>
                ) : null}
                {property.contact_phone ? (
                  <div className="hf-contact-card-row">
                    <span>Phone</span>
                    <a
                      href={`tel:${property.contact_phone.replace(/\s/g, "")}`}
                      data-testid="owner-phone"
                    >
                      {property.contact_phone}
                    </a>
                  </div>
                ) : null}
                {!property.contact_name &&
                  !property.contact_email &&
                  !property.contact_phone && (
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                      No contact details have been listed for this property yet.
                    </p>
                  )}
                <button
                  type="button"
                  className="hf-btn hf-btn-secondary"
                  onClick={() => setShowContact(false)}
                  style={{ marginTop: 12 }}
                  data-testid="hide-contact-btn"
                >
                  Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
