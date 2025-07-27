import { apiGet, apiPost, apiPut, setToken, removeToken } from './api';

const authService = {
  // Register new user
  register: (userData) => {
    return apiPost('/auth/register', userData);
  },

  // Login user
  login: (credentials) => {
    return apiPost('/auth/login', credentials);
  },

  // Get current user profile
  getCurrentUser: () => {
    return apiGet('/auth/me');
  },

  // Update user profile
  updateProfile: (userData) => {
    return apiPut('/auth/update-profile', userData);
  },

  // Verify email address
  verifyEmail: (token) => {
    return apiPost('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: () => {
    return apiPost('/auth/resend-verification');
  },

  // Send forgot password email
  forgotPassword: (email) => {
    return apiPost('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: (token, password) => {
    return apiPost('/auth/reset-password', { token, password });
  },

  // Change password (authenticated user)
  changePassword: (currentPassword, newPassword) => {
    return apiPut('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Deactivate user account
  deactivateAccount: () => {
    return apiDelete('/auth/deactivate');
  },

  // Set authentication token
  setToken: (token) => {
    setToken(token);
  },

  // Logout user
  logout: () => {
    removeToken();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('medequip_token');
    return !!token;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('medequip_token');
  },
};

export default authService;