import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppSeller from './AppSeller.jsx'
import './index.css'
import { AuthProvider } from './contexts'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppSeller />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
