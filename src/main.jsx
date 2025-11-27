// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Mengimport kode game utama Anda

// Ini adalah proses yang memasang komponen App ke div id="root" di index.html
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);