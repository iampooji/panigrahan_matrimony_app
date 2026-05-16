import { api } from "../api/apiClient";

export const getOccupation = (parenttype, parentid) =>
  api(`/occupation/${parenttype}/${parentid}`);

export const addOccupation = (parenttype, parentid, data) =>
  api(`/occupation/${parenttype}/${parentid}`, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateOccupation = (id, data) =>
  api(`/occupation/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteOccupation = (id) =>
  api(`/occupation/${id}`, { method: "DELETE" });
