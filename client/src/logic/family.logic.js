import { api } from "../api/apiClient";

// GET /profiles/:id/family
export const getFamily = (profileId) => {
  return api(`/profiles/${profileId}/family`);
};

// POST /profiles/:id/family
export const addFamily = (profileId, data) => {
  return api(`/profiles/${profileId}/family`, {
    method: "POST",
    body: JSON.stringify(data)
  });
};

// PUT /profiles/family/:familyId
export const updateFamily = (familyId, data) => {
  return api(`/profiles/family/${familyId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
};

// DELETE /profiles/family/:familyId
export const deleteFamily = (familyId) => {
  return api(`/profiles/family/${familyId}`, {
    method: "DELETE"
  });
};
