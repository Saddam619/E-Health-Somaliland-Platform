const API_BASE = "http://localhost:5000/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to ensure the URL always has a proper slash
const getUrl = (endpoint) => endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

export async function get(endpoint) {
  try {
    const res = await fetch(getUrl(endpoint), { headers: authHeaders() });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Server error");
    }
    return await res.json();
  } catch (err) {
    console.error("GET error:", err);
    throw err; 
  }
}

export async function post(endpoint, data) {
  try {
    const res = await fetch(getUrl(endpoint), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Submission failed");
    }
    return await res.json();
  } catch (err) {
    console.error("POST error:", err);
    // This alert helps you debug the "Missing fields" issue
    alert("Error: " + err.message); 
    return { success: false, error: err.message };
  }
}

export async function patch(endpoint, data) {
  try {
    const res = await fetch(getUrl(endpoint), {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Update failed");
    return await res.json();
  } catch (err) {
    console.error("PATCH error:", err);
    throw err;
  }
}

// THIS WAS LIKELY MISSING OR NAMED DIFFERENTLY
export async function del(endpoint) {
  try {
    const res = await fetch(getUrl(endpoint), {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Delete failed");
    // Return empty object if no content, otherwise parse json
    return await res.json().catch(() => ({ success: true }));
  } catch (err) {
    console.error("DELETE error:", err);
    alert("Delete failed: " + err.message);
    throw err;
  }
}