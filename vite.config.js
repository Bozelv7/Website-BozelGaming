import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // *PENTING: Ini memastikan semua aset (JavaScript dan CSS) diakses menggunakan jalur RELATIF.
  // Ini adalah fix paling umum untuk blank screen di Netlify/Hosting Statis lainnya.*
  base: './', 
  plugins: [react()],
});