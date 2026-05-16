/**
 * Date & time formatting
 */
export const formatDates = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

export const formatDateTimes = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

export const isPastDate = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Number & currency formatting
 */
export const formatNumber = (value) => {
  if (value == null) return "";
  return new Intl.NumberFormat().format(value);
};

export const formatCurrency = (
  value,
  currency = "USD"
) => {
  if (value == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);
};
