    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    
    // https://vitejs.dev/config/
    export default defineConfig({
      // PENTING: Mengatur base path ke jalur relatif (./) agar semua aset ditemukan dengan benar di Netlify/Hosting Statis.
      base: './', 
      plugins: [react()],
    });
    

