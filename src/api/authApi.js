import axios from 'axios';

const BASE_URL = 'https://cicd-assignment1-kappa.vercel.app';
console.log('BASE_URL being used:', BASE_URL);
console.log('REACT_APP_API_URL env var:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
    console.log('Adding token to request:', token);
    console.log('Request headers:', config.headers);
  } else {
    console.log('No token found in localStorage');
  }
  return config;
});

// Add response interceptor to debug responses
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('Unauthorized - removing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Register new user
  register: (userData) => {
    return api.post('/api/auth/register/', userData);
  },

  // Login user
  login: (credentials) => {
    return api.post('/api/auth/login/', credentials);
  },

  // Logout user
  logout: () => {
    return api.post('/api/auth/logout/');
  },

  // Get user profile
  getProfile: () => {
    return api.get('/api/auth/profile/');
  },

  // Update user profile
  updateProfile: (profileData) => {
    return api.put('/api/auth/profile/update/', profileData);
  },
};

export default api;
