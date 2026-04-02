import axios from "axios";

const ADMIN_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/admin`;

export function getAdminToken() {
  return localStorage.getItem("adminToken");
}

export function getAdminHeaders() {
  const token = getAdminToken();
  return {
    Authorization: `Bearer ${token}`,
    adminToken: token,
  };
}

export function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
}

export function getAdminIdentity() {
  try {
    return JSON.parse(localStorage.getItem("adminData") || "null");
  } catch {
    return null;
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function adminGet(path) {
  return axios.get(`${ADMIN_BASE_URL}${path}`, {
    headers: getAdminHeaders(),
  });
}

export async function adminPatch(path, payload) {
  return axios.patch(`${ADMIN_BASE_URL}${path}`, payload, {
    headers: getAdminHeaders(),
  });
}

export async function adminDelete(path) {
  return axios.delete(`${ADMIN_BASE_URL}${path}`, {
    headers: getAdminHeaders(),
  });
}
