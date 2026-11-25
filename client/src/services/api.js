import axios from "axios";

export const TOKEN_KEY = "lovaction_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/auth/login")) {
      window.dispatchEvent(new CustomEvent("lovaction:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export function apiError(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details[0].message;
  return data?.message || error?.message || fallback;
}

export default api;
