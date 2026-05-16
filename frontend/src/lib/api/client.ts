import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {
        // ignore malformed storage
      }
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await apiClient.post("/auth/refresh");
        return apiClient(error.config);
      } catch {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);
