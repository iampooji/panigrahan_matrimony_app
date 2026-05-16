import { useEffect, useState } from "react";
import {
  loadProducts,
  handleCreateProduct,
  handleDeleteProduct
} from "../logic/products.logic";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    loadProducts(setProducts);
  }, []);

  return (
    <div className="page">
      <h2>Products</h2>

      <input
        placeholder="New product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={() =>
          handleCreateProduct(name, setName, setProducts)
        }
      >
        Add
      </button>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name}
            <button
              onClick={() =>
                handleDeleteProduct(p.id, setProducts)
              }
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
