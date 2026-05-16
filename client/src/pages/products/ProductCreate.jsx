import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../api/productApi";

export default function ProductCreate() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createProduct({ name });
    navigate("/products"); // redirect after success
  };

  return (
    <div className="page">
      <h2>Create Product</h2>

      <input
        placeholder="Product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={handleSubmit}>Save</button>
      <button onClick={() => navigate("/products")}>Cancel</button>
    </div>
  );
}
