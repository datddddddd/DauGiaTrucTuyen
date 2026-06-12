import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. Import module 'path' của Node.js để xử lý đường dẫn

export default defineConfig({
  plugins: [ react() ],
  server: {
    port: 5173,
    proxy: { 
      '/api': { 
        target: 'http://127.0.0.1:8000', 
        changeOrigin: true 
      } 
    }
  },
  // 2. Thêm cấu hình định tuyến alias cho React và React DOM ở đây
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
})