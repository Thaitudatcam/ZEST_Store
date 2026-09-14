import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const posPaths = ['/admin/pos', '/admin/orders/pos']

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-gold border-t-transparent rounded-full" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  const role = typeof user.vaiTro === 'object' ? user.vaiTro?.tenVaiTro : user.vaiTro
  const choPhepBanHang = user.choPhepBanHang

  if (role === 'ADMIN') return children

  if (role === 'STAFF' && choPhepBanHang) {
    const isPosRoute = posPaths.some(p => pathname.startsWith(p))
    if (isPosRoute) return children
    return <Navigate to="/admin/pos" replace />
  }

  return <Navigate to="/login" replace />
}
