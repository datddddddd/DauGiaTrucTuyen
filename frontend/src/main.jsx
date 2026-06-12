import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Import AuthProvider từ folder contexts của bạn
import { AuthProvider } from './contexts' 
// Lưu ý: Nếu bạn chưa tạo file index.js/jsx để export chung trong folder contexts, 
// hãy import trực tiếp: import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)