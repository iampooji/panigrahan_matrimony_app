import { api } from "../api/apiClient";

export async function getGothras() {

  return await api("/gothra");

}