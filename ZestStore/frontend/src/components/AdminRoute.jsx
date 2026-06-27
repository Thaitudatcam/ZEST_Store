import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  // 1. Đang load thì chờ
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  // 2. Chưa đăng nhập → về login
  if (!user) return <Navigate to="/login" replace />

  // 3. Lấy role SAU KHI đã chắc chắn user không null
  const role = typeof user.vaiTro === 'object' ? user.vaiTro?.tenVaiTro : user.vaiTro

  // 4. Không phải ADMIN → về login
  if (role !== 'ADMIN') return <Navigate to="/login" replace />

  return children
}
