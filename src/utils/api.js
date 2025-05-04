import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

export const login = async (credentials) => {
  return api.post('/auth/login', credentials);
};

export const getCurrentUser = async () => {
  return api.get('/auth/profile');
};

// KYC API calls
export const submitKyc = async (kycData) => {
  return api.post('/kyc/submit', kycData);
};

export const getKyc = async () => {
  return api.get('/kyc/status');
};

export const updateKyc = async (kycData) => {
  return api.put('/kyc', kycData);
};

// Invoice API calls - Seller
export const createInvoice = async (invoiceData) => {
  return api.post('/invoices', invoiceData);
};

export const getSellerInvoices = async () => {
  return api.get('/invoices/seller');
};

// Invoice API calls - Buyer
export const getBuyerInvoices = async () => {
  return api.get('/invoices/buyer');
};

export const approveInvoice = async (invoiceId) => {
  return api.put(`/invoices/${invoiceId}/status`, { status: 'approved' });
};

export const requestCorrection = async (invoiceId, correctionData) => {
  return api.put(`/invoices/${invoiceId}/status`, { 
    status: 'correction_requested',
    correctionNotes: correctionData.correctionNotes
  });
};

export const resendInvoice = async (invoiceId, updatedData) => {
  return api.put(`/invoices/${invoiceId}`, updatedData);
};

// Shared Invoice API calls
export const getInvoice = async (invoiceId) => {
  return api.get(`/invoices/${invoiceId}`);
};

export const getInvoicePdf = async (invoiceId) => {
  return api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
};

// User API calls
export const getAllBuyers = async () => {
  return api.get('/invoices/buyers');
};

export default api;