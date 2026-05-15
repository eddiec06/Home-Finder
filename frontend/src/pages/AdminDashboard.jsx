import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

const blankForm = {
  title: "",
  location: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  description: "",
  image_url: "",
  listing_type: "rent",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // property being edited or null=create
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const data = await api.searchProperties({});
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "admin") {
      reload();
    }
  }, [user]);

  if (user === undefined) return <p>Loading…</p>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setModalOpen(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({
      title: p.title,
      location: p.location,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      description: p.description,
      image_url: p.image_url,
      listing_type: p.listing_type || "rent",
      contact_name: p.contact_name || "",
      contact_email: p.contact_email || "",
      contact_phone: p.contact_phone || "",
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      };
      if (editing) {
        await api.updateProperty(editing.propertyID, payload);
      } else {
        await api.createProperty(payload);
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteProperty(p.propertyID);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="hf-section-head">
        <div>
          <h2>Admin · Property listings</h2>
          <p style={{ color: "var(--muted)", margin: "4px 0 0 0" }}>
            Add, edit or remove listings shown on the public site.
          </p>
        </div>
        <button
          className="hf-btn"
          onClick={openCreate}
          data-testid="admin-add-btn"
        >
          + Add property
        </button>
      </div>

      {error && (
        <div className="hf-error" data-testid="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <div className="hf-empty">No properties yet.</div>
      ) : (
        <table className="hf-table" data-testid="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Location</th>
              <th>Price</th>
              <th>Bd</th>
              <th>Ba</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.propertyID} data-testid={`admin-row-${p.propertyID}`}>
                <td>{p.title}</td>
                <td>
                  <span className={`hf-badge hf-badge--${p.listing_type === "sale" ? "sale" : "rent"}`}>
                    {p.listing_type === "sale" ? "For sale" : "For rent"}
                  </span>
                </td>
                <td>{p.location}</td>
                <td>€{Number(p.price).toLocaleString()}</td>
                <td>{p.bedrooms}</td>
                <td>{p.bathrooms}</td>
                <td className="hf-table-actions">
                  <button
                    className="hf-btn hf-btn-secondary"
                    onClick={() => openEdit(p)}
                    data-testid={`admin-edit-${p.propertyID}`}
                  >
                    Edit
                  </button>
                  <button
                    className="hf-btn hf-btn-danger"
                    onClick={() => remove(p)}
                    data-testid={`admin-delete-${p.propertyID}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="hf-modal-backdrop" role="dialog">
          <div className="hf-modal" data-testid="admin-modal">
            <h3>{editing ? "Edit property" : "Add new property"}</h3>
            <form onSubmit={save}>
              <div className="hf-field">
                <label>Title</label>
                <input
                  className="hf-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  data-testid="admin-form-title"
                />
              </div>
              <div className="hf-field">
                <label>Location</label>
                <input
                  className="hf-input"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                  data-testid="admin-form-location"
                />
              </div>
              <div className="hf-row-2">
                <div className="hf-field">
                  <label>Price (€/mo)</label>
                  <input
                    className="hf-input"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    required
                    data-testid="admin-form-price"
                  />
                </div>
                <div className="hf-field">
                  <label>Image URL</label>
                  <input
                    className="hf-input"
                    value={form.image_url}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                    required
                    data-testid="admin-form-image"
                  />
                </div>
              </div>
              <div className="hf-row-2">
                <div className="hf-field">
                  <label>Bedrooms</label>
                  <input
                    className="hf-input"
                    type="number"
                    min="0"
                    value={form.bedrooms}
                    onChange={(e) =>
                      setForm({ ...form, bedrooms: e.target.value })
                    }
                    required
                    data-testid="admin-form-bedrooms"
                  />
                </div>
                <div className="hf-field">
                  <label>Bathrooms</label>
                  <input
                    className="hf-input"
                    type="number"
                    min="0"
                    value={form.bathrooms}
                    onChange={(e) =>
                      setForm({ ...form, bathrooms: e.target.value })
                    }
                    required
                    data-testid="admin-form-bathrooms"
                  />
                </div>
              </div>
              <div className="hf-field">
                <label>Description</label>
                <textarea
                  className="hf-input"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  data-testid="admin-form-description"
                />
              </div>

              <div className="hf-row-2">
                <div className="hf-field">
                  <label>Listing type</label>
                  <select
                    className="hf-select"
                    value={form.listing_type}
                    onChange={(e) =>
                      setForm({ ...form, listing_type: e.target.value })
                    }
                    data-testid="admin-form-listing-type"
                  >
                    <option value="rent">For rent</option>
                    <option value="sale">For sale</option>
                  </select>
                </div>
                <div className="hf-field">
                  <label>Contact name</label>
                  <input
                    className="hf-input"
                    value={form.contact_name}
                    onChange={(e) =>
                      setForm({ ...form, contact_name: e.target.value })
                    }
                    data-testid="admin-form-contact-name"
                  />
                </div>
              </div>
              <div className="hf-row-2">
                <div className="hf-field">
                  <label>Contact email</label>
                  <input
                    className="hf-input"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) =>
                      setForm({ ...form, contact_email: e.target.value })
                    }
                    data-testid="admin-form-contact-email"
                  />
                </div>
                <div className="hf-field">
                  <label>Contact phone</label>
                  <input
                    className="hf-input"
                    value={form.contact_phone}
                    onChange={(e) =>
                      setForm({ ...form, contact_phone: e.target.value })
                    }
                    data-testid="admin-form-contact-phone"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="hf-btn hf-btn-secondary"
                  onClick={() => setModalOpen(false)}
                  data-testid="admin-form-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hf-btn"
                  disabled={saving}
                  data-testid="admin-form-save"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
