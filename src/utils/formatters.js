// Currency formatter for Indian Rupees (₹) with 2 decimal places and standard Indian comma formatting
export const formatINR = (value) => {
  const num = Number(value);
  if (isNaN(num)) return "₹0.00";
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

