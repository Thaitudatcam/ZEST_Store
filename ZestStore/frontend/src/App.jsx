import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import AuthPage from './pages/AuthPage'
import ForgotPassword from './pages/ForgotPassword'
import OtpVerifyPage from './pages/OtpVerifyPage'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import UserVouchers from './pages/UserVouchers'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import ViZeststore from './pages/ViZeststore'
import LoyaltyPoints from './pages/LoyaltyPoints'
import PaymentResult from './pages/PaymentResult'
import PolicyPage from './pages/PolicyPage'
import AboutPage from './pages/AboutPage'
import ErrorBoundary from './components/ErrorBoundary'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminProductVariantDetail from './pages/admin/AdminProductVariantDetail'
import AdminCategories from './pages/admin/AdminCategories'
import AdminBrands from './pages/admin/AdminBrands'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminReturns from './pages/admin/AdminReturns'
import AdminReviews from './pages/admin/AdminReviews'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import AdminDiemQuyTac from './pages/admin/AdminDiemQuyTac'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPOS from './pages/admin/AdminPOS'
import AdminThongKe from './pages/admin/AdminThongKe'
import AdminChangePassword from './pages/admin/AdminChangePassword'
import AiChat from './components/AiChat'
import ScrollProgress from './components/ui/ScrollProgress'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <ToastProvider>
      <ScrollProgress />
      <ScrollToTop />
      <Routes>
      <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Navigate to="/admin/orders/online" replace />} />
        <Route path="orders/online" element={<AdminOrders />} />
        <Route path="orders/pos" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/create" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="products/detail" element={<AdminProductVariantDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="thong-ke" element={<AdminThongKe />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="diem-quy-tac" element={<AdminDiemQuyTac />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="customers" element={<AdminUsers />} />
        <Route path="employees" element={<AdminUsers />} />
        <Route path="pos" element={<AdminPOS />} />
        <Route path="change-password" element={<AdminChangePassword />} />
      </Route>

      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/quen-mat-khau" element={<ForgotPassword />} />
      <Route path="/xac-thuc-otp" element={<OtpVerifyPage />} />
      <Route path="*" element={
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Navigate to="/" replace />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/policies/:slug" element={<PolicyPage />} />
              <Route path="/gioi-thieu" element={<AboutPage />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><ErrorBoundary><Checkout /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/vouchers" element={<ProtectedRoute><UserVouchers /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><ErrorBoundary><OrderDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/vi-zeststore" element={<ProtectedRoute><ViZeststore /></ProtectedRoute>} />
              <Route path="/tich-diem" element={<ProtectedRoute><LoyaltyPoints /></ProtectedRoute>} />
              <Route path="/payment/result" element={<PaymentResult />} />
            </Routes>
          </main>
          <Footer />
          <AiChat />
        </div>
      } />
    </Routes>
    </ToastProvider>
  )
}
