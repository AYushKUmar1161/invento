import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Helper for extracting API errors
export const getErrorMessage = (error) => {
  if (error.response) {
    // If backend returned custom validation error with .errors details
    if (error.response.status === 422 && error.response.data?.errors) {
      return error.response.data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
    }
    return error.response.data?.detail || error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    return 'Unable to reach the server. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export default api;
