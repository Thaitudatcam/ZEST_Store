import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  const role = typeof user.vaiTro === 'object' ? user.vaiTro?.tenVaiTro : user.vaiTro
  if (!user || role !== 'ADMIN') return <Navigate to="/login" replace />
  return children
}
