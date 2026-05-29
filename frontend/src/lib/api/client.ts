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
    const config = error.config;
    if (error.response?.status === 401 && !config?._retry) {
      config._retry = true;
      try {
        const refreshResp = await apiClient.post("/auth/refresh");
        const newToken: string = refreshResp.data.access_token;

        // Persist new access token so subsequent requests pick it up
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("auth-storage");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.state) {
                parsed.state.accessToken = newToken;
                localStorage.setItem("auth-storage", JSON.stringify(parsed));
              }
            } catch {
              // ignore malformed storage
            }
          }
        }

        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
