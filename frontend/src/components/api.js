import axios from "axios";

export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("jwt") || "";
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, ...extra }
    : { ...extra };
}

export const api = axios.create({
  baseURL: API_URL,
});

export async function apiFetch(endpoint, options = {}) {
  const { method = "GET", headers = {}, body } = options;

  return fetch(`${API_URL}${endpoint}`, {
    method,
    headers: body instanceof FormData ? authHeaders() : authHeaders(headers),
    body,
  });
}