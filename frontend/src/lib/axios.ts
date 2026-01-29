import axios from "axios";

const baseURL = import.meta.env.PROD
  ? "/api/v1"
  : import.meta.env.VITE_SERVER_API; // Comes from your .env

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem("auth");
      if (authData) {
        const { accessToken } = JSON.parse(authData);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch (error) {
      console.error("Error reading auth token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.data);
      if (error.response.status === 401) {
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
