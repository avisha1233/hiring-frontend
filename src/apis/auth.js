const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export function loginApi({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }).then((res) => res?.data || res);
}

export function registerApi({ role, name, email, password }) {
  const path =
    role === "company" ? "/auth/signup/company" : "/auth/signup/candidate";

  return request(path, {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password }),
  }).then((res) => res?.data || res);
}

export function logoutApi(accessToken) {
  return request("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res?.data || res);
}

export function getMeApi(accessToken) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res?.data || res);
}
