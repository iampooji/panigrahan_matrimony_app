import { api } from "./apiClient";

export const fetchCustomers = () => api("/customers");

export const createCustomer = (data) =>
  api("/customers", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const deleteCustomer = (id) =>
  api(`/customers/${id}`, { method: "DELETE" });
