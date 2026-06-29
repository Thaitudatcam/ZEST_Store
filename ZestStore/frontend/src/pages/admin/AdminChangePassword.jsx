import { useState } from 'react'
import { changePassword } from '../../api/users'
import { Eye, EyeOff, Lock } from 'lucide-react'

export default function AdminChangePassword() {
  const [pwd, setPwd] = useState({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
  const [showPwd, setShowPwd] = useState({ cu: false, moi: false, xacNhan: false })
  const [msg, setMsg] = useState({ text: '', type: '' })

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ text: '', type: '' })
    if (pwd.matKhauMoi.length < 6) { setMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', type: 'error' }); return }
    if (pwd.matKhauMoi !== pwd.xacNhanMatKhauMoi) { setMsg({ text: 'Mật khẩu mới không khớp', type: 'error' }); return }
    try {
      await changePassword({ matKhauCu: pwd.matKhauCu, matKhauMoi: pwd.matKhauMoi })
      setMsg({ text: 'Đổi mật khẩu thành công', type: 'success' })
      setPwd({ matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Mật khẩu cũ không đúng', type: 'error' })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Đổi mật khẩu</h1>
      <div className="max-w-lg">
        {msg.text && (
          <p className={`text-sm mb-4 ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu cũ</label>
            <input type={showPwd.cu ? 'text' : 'password'} value={pwd.matKhauCu}
              onChange={(e) => setPwd({ ...pwd, matKhauCu: e.target.value })}
              placeholder="Nhập mật khẩu cũ" required
              className="w-full border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, cu: !showPwd.cu })}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
              {showPwd.cu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu mới</label>
            <input type={showPwd.moi ? 'text' : 'password'} value={pwd.matKhauMoi}
              onChange={(e) => setPwd({ ...pwd, matKhauMoi: e.target.value })}
              placeholder="Nhập mật khẩu mới" required minLength={6}
              className="w-full border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, moi: !showPwd.moi })}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
              {showPwd.moi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Xác nhận mật khẩu mới</label>
            <input type={showPwd.xacNhan ? 'text' : 'password'} value={pwd.xacNhanMatKhauMoi}
              onChange={(e) => setPwd({ ...pwd, xacNhanMatKhauMoi: e.target.value })}
              placeholder="Nhập lại mật khẩu mới" required
              className="w-full border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPwd({ ...showPwd, xacNhan: !showPwd.xacNhan })}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
              {showPwd.xacNhan ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  )
}