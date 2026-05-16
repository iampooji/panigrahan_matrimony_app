import {
  fetchProducts,
  createProduct,
  deleteProduct
} from "../api/productApi";

/**
 * Load products and update state
 */
export const loadProducts = async (setProducts) => {
  const data = await fetchProducts();
  setProducts(data || []);
};

/**
 * Create a product and reload list
 */
export const handleCreateProduct = async (
  name,
  setName,
  setProducts
) => {
  if (!name.trim()) return;

  await createProduct({ name });
  setName("");
  await loadProducts(setProducts);
};

/**
 * Delete product and reload list
 */
export const handleDeleteProduct = async (
  id,
  setProducts
) => {
  await deleteProduct(id);
  await loadProducts(setProducts);
};
