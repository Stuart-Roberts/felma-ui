// --- FELMA: backend URL rewrite (runs before the app mounts) ---
const BACKEND = 'https://felma-backend.onrender.com';
(() => {
  const origFetch = window.fetch;
  window.fetch = (input, init) => {
    let url = typeof input === 'string' ? input : input?.url ?? '';
    if (url.startsWith('/api/')) {
      url = BACKEND + url; // e.g. '/api/list' -> 'https://felma-backend.onrender.com/api/list'
      input = typeof input === 'string' ? url : new Request(url, input);
    }
    return origFetch(input, init);
  };
})();

// --- your original Vite/React bootstrapping ---
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
