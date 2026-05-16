/**
 * Convert MySQL date (yyyy-mm-dd) → dd/mm/yyyy
 */
export const formatDateDMY = (mysqlDate) => {
  if (!mysqlDate) return "";

  const [year, month, day] = mysqlDate.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Convert dd/mm/yyyy → MySQL date (yyyy-mm-dd)
 */
export const parseDateDMYToMySQL = (dmy) => {
  if (!dmy) return "";

  const [day, month, year] = dmy.split("/");
  if (!day || !month || !year) return "";

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Validate dd/mm/yyyy
 */
export const isValidDMY = (dmy) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dmy)) return false;

  const [day, month, year] = dmy.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};


export const calculateAge = (birthdate) => {
  if (!birthdate) return "";

  const today = new Date();
  const dob = new Date(birthdate);

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
};