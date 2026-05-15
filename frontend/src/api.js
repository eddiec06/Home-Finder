// Tiny API client used everywhere.  Plain fetch, no axios.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "homefinder_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(", ")
        : "Request failed";
    throw new Error(msg);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  verifyMfa: (challenge_token, code) =>
    request("/auth/mfa/verify", {
      method: "POST",
      body: { challenge_token, code },
    }),
  me: () => request("/auth/me", { auth: true }),
  logout: () => request("/auth/logout", { method: "POST", auth: true }),

  searchProperties: (params) => {
    const q = new URLSearchParams();
    if (params.location) q.set("location", params.location);
    if (params.min_price !== "" && params.min_price != null)
      q.set("min_price", params.min_price);
    if (params.max_price !== "" && params.max_price != null)
      q.set("max_price", params.max_price);
    const qs = q.toString();
    return request(`/properties${qs ? `?${qs}` : ""}`);
  },
  createProperty: (data) =>
    request("/admin/properties", { method: "POST", body: data, auth: true }),
  updateProperty: (id, data) =>
    request(`/admin/properties/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),
  deleteProperty: (id) =>
    request(`/admin/properties/${id}`, { method: "DELETE", auth: true }),
};
