import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEmployee } from '../../api/admin'
import { getProvinces, getDistricts, getWards } from '../../api/address'
import { useToast } from '../../context/ToastContext'
import { Camera, User, X, Loader } from 'lucide-react'

export default function AdminEmployeeForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [showCamera, setShowCamera] = useState(false)

  const [form, setForm] = useState({
    hoTen: '', email: '', soDienThoai: '', matKhau: '',
    gioiTinh: true, ngaySinh: '', diaChi: '',
    vaiTro: 'STAFF', choPhepBanHang: true,
    tinhThanhPho: '', quanHuyen: '', phuongXa: '',
  })

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [provinceId, setProvinceId] = useState(0)
  const [districtId, setDistrictId] = useState(0)

  useEffect(() => {
    getProvinces().then(setProvinces).catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    if (provinceId) {
      setDistrictId(0)
      setWards([])
      setForm(f => ({ ...f, quanHuyen: '', phuongXa: '' }))
      getDistricts(provinceId).then(setDistricts).catch(() => setDistricts([]))
    }
  }, [provinceId])

  useEffect(() => {
    if (districtId) {
      setForm(f => ({ ...f, phuongXa: '' }))
      getWards(districtId).then(setWards).catch(() => setWards([]))
    }
  }, [districtId])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.hoTen || !form.email || !form.matKhau) {
      toast.error('Vui lòng điền đầy đủ họ tên, email, mật khẩu')
      return
    }
    setSaving(true)
    try {
      const diaChiFull = [form.diaChi, form.phuongXa, form.quanHuyen, form.tinhThanhPho].filter(Boolean).join(', ')
      await createEmployee({
        ...form,
        diaChi: diaChiFull || undefined,
        gioiTinh: form.gioiTinh,
        ngaySinh: form.ngaySinh || undefined,
      })
      toast.success('Thêm nhân viên thành công')
      navigate('/admin/employees')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm nhân viên thất bại')
    } finally {
      setSaving(false)
    }
  }

  const startCamera = async () => {
    setShowCamera(true)
    setScanning(false)
    setScanProgress('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      toast.error('Không thể truy cập camera')
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current) return
    setScanning(true)
    setScanProgress('Đang chụp ảnh...')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/png')

      setScanProgress('Đang nhận dạng OCR...')
      const Tesseract = await import('tesseract.js')
      const { data: { text } } = await Tesseract.recognize(imageData, 'vie', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(`Đang nhận dạng... ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      setScanProgress('Đang xử lý dữ liệu...')
      parseCCCDText(text)
      stopCamera()
      toast.success('Đã nhận dạng CCCD thành công')
    } catch (err) {
      toast.error('Nhận dạng thất bại, vui lòng thử lại')
    } finally {
      setScanning(false)
      setScanProgress('')
    }
  }

  const parseCCCDText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const fullText = lines.join(' ')

    const cccdMatch = fullText.match(/\d{12}/)
    if (cccdMatch) update('soCCCD', cccdMatch[0])

    const dobPatterns = [
      /(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/,
      /ngay\s*[:\s]*(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/i,
      /(\d{2})(\d{2})(\d{4})/,
    ]
    for (const pat of dobPatterns) {
      const m = fullText.match(pat)
      if (m) {
        const [, d, mo, y] = m.length === 4 ? m : m.slice(1)
        const yr = parseInt(y)
        if (yr >= 1900 && yr <= 2100) {
          update('ngaySinh', `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`)
          break
        }
      }
    }

    const genderMatch = fullText.match(/(NAM|Nữ|NU|Nam)/i)
    if (genderMatch) {
      const g = genderMatch[1].toLowerCase()
      update('gioiTinh', g === 'nam')
    }

    const namePatterns = [
      /ho\s*va?\s*ten\s*[:\s]*(.+)/i,
      /họ\s*tên\s*[:\s]*(.+)/i,
      /full\s*name\s*[:\s]*(.+)/i,
    ]
    for (const pat of namePatterns) {
      const m = fullText.match(pat)
      if (m) {
        let name = m[1].trim()
        name = name.replace(/\s{2,}/g, ' ')
        if (name.length > 3 && name.length < 100) {
          update('hoTen', name.toUpperCase())
          break
        }
      }
    }

    const addrPatterns = [
      /địa\s*chỉ\s*[:\s]*(.+)/i,
      /dia\s*chi\s*[:\s]*(.+)/i,
      /address\s*[:\s]*(.+)/i,
    ]
    for (const pat of addrPatterns) {
      const m = fullText.match(pat)
      if (m) {
        let addr = m[1].trim().replace(/\s{2,}/g, ' ')
        if (addr.length > 5) {
          update('diaChi', addr)
          break
        }
      }
    }
  }

  const pickImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setScanning(true)
      setScanProgress('Đang nhận dạng OCR...')
      try {
        const Tesseract = await import('tesseract.js')
        const { data: { text } } = await Tesseract.recognize(file, 'vie', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanProgress(`Đang nhận dạng... ${Math.round(m.progress * 100)}%`)
            }
          }
        })
        setScanProgress('Đang xử lý dữ liệu...')
        parseCCCDText(text)
        toast.success('Đã nhận dạng CCCD thành công')
      } catch {
        toast.error('Nhận dạng thất bại')
      } finally {
        setScanning(false)
        setScanProgress('')
      }
    }
    input.click()
  }

  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <button onClick={() => navigate('/admin/employees')} className="hover:text-[var(--primary-color)] transition">Nhân viên</button>
              <span>/</span>
              <span className="text-gray-800 font-semibold">Thêm nhân viên</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/employees')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition">
              Quay lại
            </button>
            <button onClick={startCamera}
              disabled={scanning}
              className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {scanning ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Quét CCCD
            </button>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-bold text-lg">Quét CCCD</h3>
              <button onClick={stopCamera} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full max-h-[400px] object-contain" />
              <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 rounded-xl pointer-events-none" />
            </div>
            {scanProgress && (
              <div className="px-4 py-3 bg-blue-50 text-blue-700 text-sm text-center">{scanProgress}</div>
            )}
            <div className="p-4 flex gap-3">
              <button onClick={captureAndScan} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--primary-color)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
                {scanning ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {scanning ? 'Đang quét...' : 'Chụp & Quét'}
              </button>
              <button onClick={pickImage} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                Chọn ảnh từ thư viện
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              Thông tin cơ bản
            </h2>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                <User className="h-12 w-12 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Nhấn vào hình để tải ảnh đại diện</p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Họ Và Tên <span className="text-red-500">*</span></label>
              <input value={form.hoTen} onChange={(e) => update('hoTen', e.target.value)} required
                placeholder="Nhập họ tên nhân viên"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20 transition" />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Chức vụ / Vai trò <span className="text-red-500">*</span></label>
              <select value={form.vaiTro} onChange={(e) => update('vaiTro', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition">
                <option value="STAFF">Nhân viên</option>
                <option value="ADMIN">Quản lý</option>
              </select>
            </div>
          </div>

          {/* Right: Detail Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              Thông tin chi tiết
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required
                  placeholder="example@email.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition" />
              </div>
              {/* DOB */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ngày sinh</label>
                <input type="date" value={form.ngaySinh} onChange={(e) => update('ngaySinh', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Phone */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Số Điện Thoại <span className="text-red-500">*</span></label>
                <input value={form.soDienThoai} onChange={(e) => update('soDienThoai', e.target.value)}
                  placeholder="0xxxxxxxxx"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition" />
              </div>
              {/* Gender */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Giới tính <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-6 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gioiTinh" checked={form.gioiTinh === true} onChange={() => update('gioiTinh', true)}
                      className="w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                    <span className="text-sm text-gray-700">Nam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gioiTinh" checked={form.gioiTinh === false} onChange={() => update('gioiTinh', false)}
                      className="w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                    <span className="text-sm text-gray-700">Nữ</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mật khẩu <span className="text-red-500">*</span></label>
              <input type="password" value={form.matKhau} onChange={(e) => update('matKhau', e.target.value)} required
                placeholder="Nhập mật khẩu"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition" />
            </div>

            {/* Address selects */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tỉnh/Thành phố</label>
                <select value={provinceId} onChange={(e) => {
                  const id = Number(e.target.value); setProvinceId(id)
                  const name = e.target.options[e.target.selectedIndex]?.text || ''
                  update('tinhThanhPho', id ? name : '')
                }} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition">
                  <option value={0}>Chọn Tỉnh/TP</option>
                  {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Quận/Huyện</label>
                <select value={districtId} onChange={(e) => {
                  const id = Number(e.target.value); setDistrictId(id)
                  const name = e.target.options[e.target.selectedIndex]?.text || ''
                  update('quanHuyen', id ? name : '')
                }} disabled={!provinceId} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] disabled:bg-gray-50 transition">
                  <option value={0}>Chọn Quận/Huyện</option>
                  {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Xã/Phường</label>
                <select value={form.phuongXa} onChange={(e) => update('phuongXa', e.target.value)} disabled={!districtId}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] disabled:bg-gray-50 transition">
                  <option value="">Chọn Xã/Phường</option>
                  {wards.map(w => <option key={w.WardCode} value={w.WardName}>{w.WardName}</option>)}
                </select>
              </div>
            </div>

            {/* Street address */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Địa chỉ cụ thể (Số nhà, đường)</label>
              <input value={form.diaChi} onChange={(e) => update('diaChi', e.target.value)}
                placeholder="VD: Số 10, Ngõ 5..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary-color)] transition" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-8">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Đang lưu...' : 'Thêm Nhân Viên'}
          </button>
        </div>
      </form>
    </div>
  )
}
