import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { VoucherProvider } from './context/VoucherContext'
import App from './App'
import './index.css'

// MSW mocks were removed from this build; the frontend always talks to the
// real Spring Boot API. Keeping the render path synchronous also prevents Vite
// from trying to resolve a removed dynamic mock module during import analysis.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <VoucherProvider>
            <App />
          </VoucherProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
