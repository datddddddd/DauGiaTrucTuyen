export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password.length >= 6;
};

export const validatePhoneNumber = (phone) => {
  // Vietnamese phone number format
  const re = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return re.test(phone);
};

export const validateUsername = (username) => {
  // 3-20 characters, letters and numbers only
  const re = /^[a-zA-Z0-9]{3,20}$/;
  return re.test(username);
};

export const validatePrice = (price) => {
  return price > 0 && Number.isInteger(price);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};