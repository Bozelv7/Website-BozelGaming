import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Mengambil komponen App.jsx

// Menggunakan createRoot untuk me-render aplikasi ke DOM
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

