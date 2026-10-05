// src/config/api.js
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const BACKEND_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : (process.env.REACT_APP_BACKEND_URL || 'https://bhavyams-vendorhub-backend.onrender.com/api');

export const SOCKET_URL = isLocal 
  ? 'http://localhost:5000' 
  : (process.env.REACT_APP_SOCKET_URL || 'https://bhavyams-vendorhub-backend.onrender.com');