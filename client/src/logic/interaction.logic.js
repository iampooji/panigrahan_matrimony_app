import { api } from "../api/apiClient";

// export const getInteractions = (params = {}) => {
//   // console.log(params);
//   const q = new URLSearchParams(params).toString();
//   return api(`/interactions?profileid=${params}`);
// };

export const getInteractions = (profileid) =>
  api(`/interactions/${profileid}`);

export const addInteraction = (data) =>
  api("/interactions", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const addTask = (data) =>
  api("/interactions/task", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getTasks = (id) =>
  api(`/interactions/task/${id}`);
