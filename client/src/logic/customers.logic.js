import {
  fetchCustomers,
  createCustomer,
  deleteCustomer
} from "../api/customerApi";

import { isNonEmptyString } from "../utils/validators";

import * as formatters from "../utils/validators";

/**
 * Load customers
 */
export const loadCustomers = async (setCustomers) => {
  const data = await fetchCustomers();
  setCustomers(data || []);
};

/**
 * Create customer
 */
export const handleCreateCustomer = async (
  name,
  setName,
  setCustomers
) => {
  if (!isNonEmptyString(name)) return;

  await createCustomer({ name });
  setName("");
  await loadCustomers(setCustomers);
};

/**
 * Delete customer
 */
export const handleDeleteCustomer = async (
  id,
  setCustomers
) => {
  await deleteCustomer(id);
  await loadCustomers(setCustomers);
};
