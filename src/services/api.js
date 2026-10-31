import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HTTP-only cookies
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brightloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (res.data?.accessToken) {
          localStorage.setItem('brightloop_token', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  signup: async (userData) => {
    const res = await apiClient.post('/auth/signup', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
  refreshToken: async () => {
    const res = await apiClient.post('/auth/refresh');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
  verifyEmail: async (data) => {
    const res = await apiClient.post('/auth/verify-email', data);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const customerService = {
  getAll: async () => apiClient.get('/customers'),
  getById: async (id) => apiClient.get(`/customers/${id}`),
  create: async (data) => apiClient.post('/customers', data),
  update: async (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: async (id) => apiClient.delete(`/customers/${id}`),
};

export const productService = {
  getAll: async () => apiClient.get('/products'),
  getById: async (id) => apiClient.get(`/products/${id}`),
  create: async (data) => apiClient.post('/products', data),
  update: async (id, data) => apiClient.put(`/products/${id}`, data),
  delete: async (id) => apiClient.delete(`/products/${id}`),
};

export const planService = {
  getAll: async () => apiClient.get('/plans'),
  getById: async (id) => apiClient.get(`/plans/${id}`),
  create: async (data) => apiClient.post('/plans', data),
  update: async (id, data) => apiClient.put(`/plans/${id}`, data),
  delete: async (id) => apiClient.delete(`/plans/${id}`),
};

export const subscriptionService = {
  getAll: async () => apiClient.get('/subscriptions'),
  getById: async (id) => apiClient.get(`/subscriptions/${id}`),
  create: async (data) => apiClient.post('/subscriptions', data),
  update: async (id, data) => apiClient.put(`/subscriptions/${id}`, data),
  changeStatus: async (id, status) => apiClient.patch(`/subscriptions/${id}/status`, { status }),
  renew: async (id) => apiClient.post(`/subscriptions/${id}/renew`),
};

export const quotationService = {
  getAll: async () => apiClient.get('/quotations'),
  getById: async (id) => apiClient.get(`/quotations/${id}`),
  create: async (data) => apiClient.post('/quotations', data),
  update: async (id, data) => apiClient.put(`/quotations/${id}`, data),
  convertToSubscription: async (id) => apiClient.post(`/quotations/${id}/convert`),
};

export const invoiceService = {
  getAll: async () => apiClient.get('/invoices'),
  getById: async (id) => apiClient.get(`/invoices/${id}`),
  create: async (data) => apiClient.post('/invoices', data),
  updateStatus: async (id, status) => apiClient.patch(`/invoices/${id}/status`, { status }),
};

export const discountService = {
  getAll: async () => apiClient.get('/discounts'),
  create: async (data) => apiClient.post('/discounts', data),
  update: async (id, data) => apiClient.put(`/discounts/${id}`, data),
  delete: async (id) => apiClient.delete(`/discounts/${id}`),
};

export const paymentService = {
  getAll: async () => apiClient.get('/payments'),
  recordPayment: async (data) => apiClient.post('/payments', data),
};

export const dashboardService = {
  getStats: async () => apiClient.get('/dashboard/stats'),
};

export default apiClient;
