import { clearAuthSession, getAccessToken } from "@/lib/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const { data, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || `Request failed with ${response.status}`;

    if (response.status === 401) {
      clearAuthSession();
    }

    // Keep API failures visible during development and debugging.
    console.error("API error", {
      path,
      status: response.status,
      payload,
    });

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, data, options = {}) =>
    request(path, { ...options, method: "POST", data }),
  put: (path, data, options = {}) =>
    request(path, { ...options, method: "PUT", data }),
  patch: (path, data, options = {}) =>
    request(path, { ...options, method: "PATCH", data }),
  delete: (path, options = {}) =>
    request(path, { ...options, method: "DELETE" }),
};
