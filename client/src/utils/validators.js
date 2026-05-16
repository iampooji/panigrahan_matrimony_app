export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isPositiveNumber = (num) =>
  typeof num === "number" && num > 0;

export const isValidDate = (date) =>
  date instanceof Date && !isNaN(date);
