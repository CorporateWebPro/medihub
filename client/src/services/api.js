import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'medequip_token';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  }
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

// Set token if it exists in localStorage on app load
const token = getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    const { response, request, message } = error;
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          removeToken();
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            toast.error('Session expired. Please login again.');
            // Delay redirect to allow toast to show
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
          break;
          
        case 403:
          // Forbidden
          toast.error(data?.message || 'Access denied. Insufficient permissions.');
          break;
          
        case 404:
          // Not found
          if (!data?.message?.includes('not found')) {
            toast.error(data?.message || 'Resource not found.');
          }
          break;
          
        case 422:
          // Validation error
          if (data?.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.msg || err.message);
            });
          } else {
            toast.error(data?.message || 'Validation error occurred.');
          }
          break;
          
        case 429:
          // Rate limit exceeded
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other errors
          if (status >= 400) {
            toast.error(data?.message || `Request failed with status ${status}`);
          }
          break;
      }
      
      // Return error with standardized format
      return Promise.reject({
        ...error,
        response: {
          ...response,
          data: {
            message: data?.message || `Request failed with status ${status}`,
            errors: data?.errors || [],
            status,
          },
        },
      });
    } else if (request) {
      // Network error
      console.error('Network error:', request);
      toast.error('Network error. Please check your connection.');
      
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      console.error('Request setup error:', message);
      toast.error('Request failed. Please try again.');
      
      return Promise.reject({
        ...error,
        message: 'Request failed. Please try again.',
      });
    }
  }
);

// Helper functions for different HTTP methods
export const apiGet = (url, config = {}) => api.get(url, config);
export const apiPost = (url, data, config = {}) => api.post(url, data, config);
export const apiPut = (url, data, config = {}) => api.put(url, data, config);
export const apiPatch = (url, data, config = {}) => api.patch(url, data, config);
export const apiDelete = (url, config = {}) => api.delete(url, config);

// Specialized methods for file uploads
export const apiUpload = (url, formData, onUploadProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// Method for downloading files
export const apiDownload = (url, filename) => {
  return api.get(url, {
    responseType: 'blob',
  }).then(response => {
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  });
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;