import { api } from "./apiClient";

export const fetchProducts = () => api("/products");

export const createProduct = (data) =>
  api("/products", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const deleteProduct = (id) =>
  api(`/products/${id}`, { method: "DELETE" });
