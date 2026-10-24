// API configuration helper.
// In development, VITE_API_URL is unset, so requests use relative paths ('/api/...')
// which the Vite dev server proxies to http://localhost:8080.
// In production on Vercel, set VITE_API_URL to your Render backend URL (e.g. https://your-sigmagpt.onrender.com).
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, "")
  : "";
