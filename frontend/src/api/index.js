import axios from 'axios';

const API_URL = 'http://localhost/api';

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add request interceptor with logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Token found and added to request");
    } else {
      console.log("No token found for request!");
    }
    return config;
  },
  (error) => {
    console.error("Request setup error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Received successful response from: ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server responded with error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Unauthorized - clear token
        console.error('Unauthorized request - clearing token');
        localStorage.removeItem('token');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      
      // Log additional information to help debugging
      console.error('Request was sent to:', error.config.url);
      console.error('Request method:', error.config.method);
      
      if (error.code === 'ECONNABORTED') {
        console.error('The request timed out. Check if the server is running.');
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Functions
export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);
export const getTasks = () => api.get('/tasks');
export const createTask = (taskData) => api.post('/tasks', taskData);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const completeTask = (id) => api.patch(`/tasks/${id}/complete`);

export default api;