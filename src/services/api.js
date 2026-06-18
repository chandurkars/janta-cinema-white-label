import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Tenants
export const getTenants = () => api.get('/tenants/');
export const createTenant = (data) => api.post('/tenants/', data);

// Films
export const getFilms = () => api.get('/films/');
export const createFilm = (data) => api.post('/films/', data);
export const uploadFilm = (formData, onUploadProgress) => api.post('/films/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress });
export const deleteFilm = (filmId) => api.delete(`/films/${filmId}`);
export const assignFilm = (filmId, tenantId) => api.post(`/films/${filmId}/assign/${tenantId}`);
export const getFilmAssignments = (filmId) => api.get(`/films/${filmId}/assignments`);
export const removeFilmAssignment = (filmId, tenantId) => api.delete(`/films/${filmId}/assign/${tenantId}`);
export const getFilmmakers = () => api.get('/users/filmmakers');

// Venues
export const getVenues = () => api.get('/venues/');
export const createVenue = (data) => api.post('/venues/', data);
export const updateVenue = (id, data) => api.put(`/venues/${id}`, data);

// Contracts
export const getContracts = () => api.get('/contracts/');
export const createContract = (data) => api.post('/contracts/', data);
export const confirmContract = (id) => api.patch(`/contracts/${id}/confirm`);

// Screening Keys
export const getScreeningKeys = () => api.get('/screening/keys');
export const createScreeningKey = (data) => api.post('/screening/keys', data);
export const createScreeningKeyPair = (data) => api.post('/screening/key-pairs', data);
export const createFilmmakerKey = (data) => api.post('/screening/filmmaker-keys', data);
export const revokeScreeningKey = (id) => api.delete(`/screening/keys/${id}`);
export const reactivateScreeningKey = (id) => api.post(`/screening/keys/${id}/reactivate`);
export const addKeyToGroup = (pairId, keyType = 'streaming') => api.post(`/screening/group/${pairId}/add-key?key_type=${keyType}`);

// Analytics
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getScreeningHistory = () => api.get('/analytics/screenings');

// Users
export const getUsers = () => api.get('/users/');
export const createUser = (data) => api.post('/users/', data);

// Public film info (no auth)
export const getPublicFilm = (slug) => api.get(`/films/public/${slug}`);

// Player-facing
export const validateKey = (key_token) => api.post('/screening/validate', { key_token });
export const activateKey = (key_token, machine_fingerprint, player_version, resume_token) =>
  api.post('/screening/activate', { key_token, machine_fingerprint, player_version, resume_token });
export const completeSession = (session_id, completion_percentage) =>
  api.post('/screening/complete', { session_id, completion_percentage });

// Premieres
export const createPremiere = (data) => api.post('/premieres/', data);
export const getPremieres = () => api.get('/premieres/');
export const cancelPremiere = (id) => api.delete(`/premieres/${id}`);

// Public premiere (no auth)
export const getPublicPremiere = (slug) => api.get(`/premieres/public/${slug}`);
export const getPremiereStream = (slug) => api.post(`/premieres/public/${slug}/stream`);
export const premiereHeartbeat = (slug, headers = {}) =>
  api.post(`/premieres/public/${slug}/heartbeat`, null, { headers });

export default api;
