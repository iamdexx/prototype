import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required for WebXR, getUserMedia and getDisplayMedia on
// non-localhost origins (Quest browser, phones on LAN, etc).
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
});
