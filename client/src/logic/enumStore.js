import { api } from "../api/apiClient";

let cache = {};

export const loadFormEnums = async (formName) => {
  if (cache[formName]) {
    return cache[formName];
  }

  const data = await api(`/enumtypes/forms/${formName}`, {
    method: "GET"
  });

  cache[formName] = data;
  return data;
};

export const clearEnumCache = () => {
  cache = {};
};
