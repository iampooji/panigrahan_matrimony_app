import { api } from "../api/apiClient";

export const searchInteractions = (filters) => {
  const q = new URLSearchParams(filters).toString();
  return api(`/interactions/search?${q}`);
};

export const searchTasks = (filters) => {
  const q = new URLSearchParams(filters).toString();
  return api(`/interactions/tasks/search?${q}`);
};

// Added this for updating status of tasks
export const updateTaskStatus = (taskId, status, closeReason = null) => {
  return api(`/interactions/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, closeReason }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

