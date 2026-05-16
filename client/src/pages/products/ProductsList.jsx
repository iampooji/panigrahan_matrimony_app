import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, handleDeleteProduct } from "../../logic/products.logic";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts(setProducts);
  }, []);

  return (
    <div className="page">
      <h2>Products</h2>

      <button onClick={() => navigate("/products/new")}>
        Add New
      </button>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name}
            <button onClick={() => handleDeleteProduct(p.id, setProducts)}>
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
