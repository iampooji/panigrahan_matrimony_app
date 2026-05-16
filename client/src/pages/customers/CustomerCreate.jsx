import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../../api/customerApi";

export default function CustomerCreate() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createCustomer({ name });
    navigate("/customers");
  };

  return (
    <div className="page">
      <h2>Create Customer</h2>

      <input
        placeholder="Customer name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={handleSubmit}>Save</button>
      <button onClick={() => navigate("/customers")}>Cancel</button>
    </div>
  );
}
