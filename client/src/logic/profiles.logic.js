import { api } from "../api/apiClient";

export const getProfile = (id) => api(`/profiles/${id}`);

export const createProfile = (data) => {
  return api("/profiles", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

export const updateProfile = (id, data) =>
  api(`/profiles/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getActiveProfileCountByGender = () =>
  api("/profiles/stats/active-by-gender");

export const searchProfiles = (filters, isAdmin = false, page = 1) => {
  const params = new URLSearchParams({ page });
  if (isAdmin) params.set("includeplan", "true");
  return api(`/profiles/search?${params}`, { method: "POST", body: JSON.stringify(filters) });
};

export const searchProfilesAdmin = (filters, page = 1) => {
  const params = new URLSearchParams({ page, includeplan: "true" });
  return api(`/profiles/search?${params}`, { method: "POST", body: JSON.stringify(filters) });
};

export const changests = async (id, sts) => {
  return api(`/profiles/${id}/changests`, {
    method: "POST",
    body: JSON.stringify({sts})
  });
};

export const setProfilePicture = async (id, attachmentId) => {
  try {
    await api(`/profiles/${id}/profile-picture`, {
      method: "POST",
      body: JSON.stringify({ attachmentId })
    });
  } catch {
    alert("Failed to set profile picture");
  }
};

export const assignPlan = (id, subscriptionName) =>
  api(`/profiles/${id}/plan`, {
    method: "POST",
    body: JSON.stringify({ subscription_name: subscriptionName })
  });

export const confirmPayment = (id) =>
  api(`/profiles/${id}/plan/confirm`, { method: "POST" });

export const getPlanHistory = (id) =>
  api(`/profiles/${id}/plans`);