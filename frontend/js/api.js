/**
 * ✅ SMART API BASE SELECTION
 * If you are on your local computer (localhost), use port 5000.
 * If you are on the internet (GitHub Pages), use your Render URL.
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// ⚠️ REPLACE 'your-app-name' with the name you choose on Render in Step 3
const API_BASE = isLocal 
    ? "http://localhost:5000/api" 
    : "https://your-app-name.onrender.com/api"; 

/**
 * ✅ AUTH HEADERS
 * Automatically attaches your JWT token to every request
 */
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
        // This helps you see why a request failed (e.g., missing fields)
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
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Update failed");
        }
        return await res.json();
    } catch (err) {
        console.error("PATCH error:", err);
        throw err;
    }
}

export async function del(endpoint) {
    try {
        const res = await fetch(getUrl(endpoint), {
            method: "DELETE",
            headers: authHeaders()
        });
        if (!res.ok) throw new Error("Delete failed");
        return await res.json().catch(() => ({ success: true }));
    } catch (err) {
        console.error("DELETE error:", err);
        alert("Delete failed: " + err.message);
        throw err;
    }
}