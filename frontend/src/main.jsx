import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { VoucherProvider } from './context/VoucherContext'
import App from './App'
import './index.css'

async function enableMocking() {
  // Tắt MSW để chạy BE thật. Muốn bật lại thì đổi thành true
  const USE_MSW = false
  if (import.meta.env.DEV && USE_MSW) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
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
})
