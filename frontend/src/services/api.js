import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with explicit configuration
const API_BASE_URL = 'http://localhost:5002/api';

console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  processEnvApiUrl: process.env.REACT_APP_API_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to extract subdomain
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost or IP addresses, return null
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  
  // If there are more than 2 parts and it's not www, first part is subdomain
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  return null;
};

// Request interceptor to add auth token and tenant headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant subdomain header for multi-tenant routing
    const subdomain = getSubdomain();
    if (subdomain) {
      config.headers['X-Tenant-Subdomain'] = subdomain;
    }
    
    // Debug logging
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      subdomain: subdomain,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
};

// Companies API
export const companiesAPI = {
  getCompanies: (params = {}) => api.get('/companies', { params }),
  getCompany: (id) => api.get(`/companies/${id}`),
  createCompany: (companyData) => api.post('/companies', companyData),
  updateCompany: (id, companyData) => api.put(`/companies/${id}`, companyData),
  deleteCompany: (id) => api.delete(`/companies/${id}`),
  getCompanyStats: (id) => api.get(`/companies/${id}/stats`),
  updateCompanyPlan: (id, planData) => api.put(`/companies/${id}/plan`, planData),
};

// Clients API
export const clientsAPI = {
  getClients: (params = {}) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (clientData) => api.post('/clients', clientData),
  updateClient: (id, clientData) => api.put(`/clients/${id}`, clientData),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  addNote: (id, noteData) => api.post(`/clients/${id}/notes`, noteData),
  getClientStats: (params = {}) => api.get('/clients/stats', { params }),
};

// Leads API
export const leadsAPI = {
  getLeads: (params = {}) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (leadData) => api.post('/leads', leadData),
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  addNote: (id, noteData) => api.post(`/leads/${id}/notes`, noteData),
  addActivity: (id, activityData) => api.post(`/leads/${id}/activities`, activityData),
  convertToClient: (id) => api.post(`/leads/${id}/convert`),
  getLeadStats: (params = {}) => api.get('/leads/stats', { params }),
};

// Tenant API
export const tenantAPI = {
  getTenantInfo: () => api.get('/tenant/info'),
  updateTenantSettings: (tenantData) => api.put('/tenant/settings', tenantData),
  getTenantUsage: () => api.get('/tenant/usage'),
  checkLimit: (limitData) => api.post('/tenant/check-limit', limitData),
};

// Super Admin API
export const superAdminAPI = {
  getDashboardStats: () => api.get('/super-admin/dashboard'),
  getTenants: (params = {}) => api.get('/super-admin/tenants', { params }),
  getTenant: (id) => api.get(`/super-admin/tenants/${id}`),
  createTenant: (tenantData) => api.post('/super-admin/tenants', tenantData),
  updateTenant: (id, tenantData) => api.put(`/super-admin/tenants/${id}`, tenantData),
  deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`),
  suspendTenant: (id) => api.put(`/super-admin/tenants/${id}/suspend`),
  activateTenant: (id) => api.put(`/super-admin/tenants/${id}/activate`),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: (params = {}) => api.get('/dashboard/overview', { params }),
  getSalesFunnel: (params = {}) => api.get('/dashboard/funnel', { params }),
  getPerformanceMetrics: (params = {}) => api.get('/dashboard/performance', { params }),
  getUpcomingTasks: (params = {}) => api.get('/dashboard/tasks', { params }),
};

// Roles API
export const rolesAPI = {
  getRoles: () => api.get('/roles'),
};

export default api;
