const API_BASE = "http://localhost:5000/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function get(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Server response error");
    return await res.json();
  } catch (err) {
    console.error("GET error:", err);
    alert("Failed to connect to server");
  }
}

export async function post(endpoint, data) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Server response error");
    return await res.json();
  } catch (err) {
    console.error("POST error:", err);
    alert("Failed to connect to server");
  }
}

export async function patch(endpoint, data) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Server response error");
    return await res.json();
  } catch (err) {
    console.error("PATCH error:", err);
    alert("Failed to connect to server");
  }
}

export async function del(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Server response error");
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error("DELETE error:", err);
    alert("Failed to connect to server");
  }
}