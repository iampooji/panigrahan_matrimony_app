import { api } from "../api/apiClient";

export const getEducation = (profile_id) =>
  api(`/education/${profile_id}`);

export const addEducation = (profile_id, data) =>
  api(`/education/${profile_id}`, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateEducation = (id, data) =>
  api(`/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteEducation = (id) =>
  api(`/education/${id}`, { method: "DELETE" });