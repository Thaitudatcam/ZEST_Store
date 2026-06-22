import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import PaymentResult from './pages/PaymentResult'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminReviews from './pages/admin/AdminReviews'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminEmployees from './pages/admin/AdminEmployees'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/create" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="employees" element={<AdminEmployees />} />
      </Route>

      <Route path="*" element={
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/payment/result" element={<PaymentResult />} />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  )
}
