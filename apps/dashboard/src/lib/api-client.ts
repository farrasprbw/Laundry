import axios from "axios";

/**
 * Axios instance pre-configured for the Laundry API.
 *
 * In development the Vite proxy forwards `/api/*` to `http://localhost:3001`,
 * so we only need a relative baseURL here.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // send Better Auth session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Response interceptor: redirect to /login on 401 ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
