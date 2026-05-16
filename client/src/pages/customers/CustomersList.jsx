import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadCustomers,
  handleDeleteCustomer
} from "../../logic/customers.logic";

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers(setCustomers);
  }, []);

  return (
    <div className="page">
      <h2>Customers</h2>

      <button onClick={() => navigate("/customers/new")}>
        Add New
      </button>

      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name}
            <button onClick={() => handleDeleteCustomer(c.id, setCustomers)}>
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
