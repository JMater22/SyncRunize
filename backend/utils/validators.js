// utils/validators.js
export const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const validatePassword = (password) => password.length >= 6;

export const validateUsername = (username) => username && username.length >= 3;
