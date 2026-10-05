import axios from 'axios';

export const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('odfe-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    sessionStorage.removeItem('odfe-token');
    window.dispatchEvent(new Event('odfe:unauthorized'));
  }
  return Promise.reject(error);
});
