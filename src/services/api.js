import axios from "axios";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

const baseURL =
  import.meta.env.REACT_APP_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);
