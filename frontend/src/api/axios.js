import axios from "axios";
import { BackendDownError } from "../types/api.types";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// REQUEST: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE: handle auth failures and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error or timeout — backend is down
    if (
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNREFUSED"
    ) {
      return Promise.reject(new BackendDownError());
    }

    // Exceptions are handled locally by forms or logged in backend console; do not trigger global toast popups.

    // 401, 403, or current user / dashboard summary fails (user deleted/missing in DB)
    const isUserEndpointFailed =
      error.response &&
      (error.config?.url?.includes("/employees/me") || error.config?.url?.includes("/dashboard/employee"));

    if (
      error.response &&
      (error.response.status === 401 ||
       error.response.status === 403 ||
       (isUserEndpointFailed && (error.response.status === 404 || error.response.status === 500)))
    ) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("token");
        localStorage.removeItem("employeeId");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
