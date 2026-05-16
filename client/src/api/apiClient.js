const API_BASE = "http://13.222.94.130:30081/api";

export const api = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  // Auth failure — only redirect if not on login endpoint
  if (res.status === 401 && !url.includes("/auth/login")) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  // No content
  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    // Throw error so catch block in caller gets the actual message
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  const text = await res.text();
  console.error("Non-JSON response:", text);
  throw new Error(`Unexpected response (${res.status}). Check server logs.`);
};