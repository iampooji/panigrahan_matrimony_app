import { useEffect, useState } from "react";
import {
  loadCustomers,
  handleCreateCustomer,
  handleDeleteCustomer
} from "../logic/customers.logic";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    loadCustomers(setCustomers);
  }, []);

  return (
    <div className="page">
      <h2>Customers</h2>

      <input
        placeholder="Customer name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={() =>
          handleCreateCustomer(name, setName, setCustomers)
        }
      >
        Add
      </button>

      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name}
            <button
              onClick={() =>
                handleDeleteCustomer(c.id, setCustomers)
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
