import { useState, useEffect } from 'react'
import api from '../../api/axios'    
import { getRevenueByDay, getRevenueByMonth, getRevenueByYear, 
         getBestSelling, getOrderStats, getStats, 
         exportAndSendEmail
} from '../../api/admin'
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, XCircle, CheckCircle, Clock, Loader } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function AdminThongKe() {
  const [tab, setTab] = useState('day')
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [bestSelling, setBestSelling] = useState([])
  const [orderStats, setOrderStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [tuNgay, setTuNgay] = useState(firstDay)
  const [denNgay, setDenNgay] = useState(today)
  const [thang, setThang] = useState(new Date().getMonth() + 1) 
const [nam, setNam] = useState(new Date().getFullYear())

  const load = async () => {
    setLoading(true)
    try {
      const [st, bs, os] = await Promise.all([
        getStats().catch(() => null),
        getBestSelling(10).catch(() => []),
        getOrderStats().catch(() => null),
      ])
      setStats(st)
      setBestSelling(Array.isArray(bs) ? bs : [])
      setOrderStats(os)
    } catch {}
    setLoading(false)
  }

const validateFilter = () => {
  if (tab === 'day') {
    if (!tuNgay || !denNgay) {
      alert("Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc!");
      setRevenueData([]); // THÊM
      return false;
    }
    if (new Date(tuNgay) > new Date(denNgay)) {
      alert("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc!");
      setRevenueData([]); // THÊM
      return false;
    }
  }
  if (tab === 'month') {
    if (thang < 1 || thang > 12) {
      alert("Tháng phải từ 1 đến 12!");
      setRevenueData([]); // THÊM
      return false;
    }
    if (nam < 2000 || nam > new Date().getFullYear()) {
      alert(`Năm phải từ 2000 đến ${new Date().getFullYear()}!`);
      setRevenueData([]); // THÊM
      return false;
    }
  }
  return true;
}

 const loadRevenue = async () => {
  if (!validateFilter()) return; 
    try {
      let data
      if (tab === 'day') {
        data = await getRevenueByDay(tuNgay, denNgay)
      } else if (tab === 'month') {
        data = await getRevenueByMonth(thang, nam)
      } else {
        data = await getRevenueByYear()
      }
      setRevenueData(Array.isArray(data) ? data : [])
    } catch { 
      setRevenueData([]) 
    }
  }

 useEffect(() => { 
  load() 
  const interval = setInterval(load, 30000)
  return () => clearInterval(interval)
}, [])
  useEffect(() => { loadRevenue() }, [tab])

    const exportExcel = async () => {
  const params = new URLSearchParams()
  if (tuNgay) params.append('tuNgay', tuNgay)
  if (denNgay) params.append('denNgay', denNgay)
  
  try {
    // 1. Download file
    const res = await api.get(`/dashboard/export-excel?${params}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url; a.download = 'thong-ke.xlsx'
    document.body.appendChild(a); a.click(); a.remove()
    window.URL.revokeObjectURL(url)

    // 2. Gửi email (background, không chặn download)
    exportAndSendEmail(tuNgay || undefined, denNgay || undefined)
      .then(() => alert('Đã gửi email báo cáo thành công!'))
      .catch(() => alert('Gửi email thất bại, kiểm tra lại cấu hình SMTP'))
  } catch (e) {
    console.error('Export failed', e)
  }
}
  const summaryCards = orderStats ? [
    { label: 'Tổng đơn hàng', value: orderStats.totalOrders ?? 0, icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
    { label: 'Đã giao', value: orderStats.completed ?? 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Đã hủy', value: orderStats.cancelled ?? 0, icon: XCircle, color: 'from-red-500 to-red-600' },
    { label: 'Đang chờ', value: orderStats.pending ?? 0, icon: Clock, color: 'from-amber-500 to-amber-600' },
  ] : []

  const donutData = orderStats ? [
    { name: 'Đang chờ', value: orderStats.pending ?? 0 },
    { name: 'Đang giao', value: orderStats.shipping ?? 0 },
    { name: 'Đã giao', value: orderStats.completed ?? 0 },
    { name: 'Đã hủy', value: orderStats.cancelled ?? 0 },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thống kê</h1>
        <div className="flex items-center gap-2">
         <button onClick={load}
      className="border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
      🔄 Làm mới
    </button>
        <button onClick={exportExcel}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Xuất Excel
        </button>
      </div>
      </div>

      {/* 4 thẻ tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} text-white p-5 shadow-lg`}>
              <div className="relative z-10">
                <p className="text-sm opacity-80">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <Icon className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
            </div>
          )
        })}
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Doanh thu</h2>
          <div className="flex gap-2 items-center">
            <button onClick={() => setTab('day')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ngày</button>
            <button onClick={() => setTab('month')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Tháng</button>
            <button onClick={() => setTab('year')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Năm</button>
          </div>
        </div>
        {tab === 'day' && (
          <div className="flex gap-3 mb-4">
            <div><label className="text-xs text-gray-500">Từ ngày</label><input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm ml-2" /></div>
            <div><label className="text-xs text-gray-500">Đến ngày</label><input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm ml-2" /></div>
            <button onClick={loadRevenue} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
      Xem thống kê
    </button>
          </div>
        )}
        {tab === 'month' && (
  <div className="flex gap-3 mb-4">
    <div>
      <label className="text-xs text-gray-500">Tháng</label>
      <select 
        value={thang} 
        onChange={e => setThang(Number(e.target.value))} 
        className="border rounded-lg px-3 py-1.5 text-sm ml-2"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-xs text-gray-500">Năm</label>
      <input 
        type="number" 
        value={nam} 
        onChange={e => setNam(Number(e.target.value))} 
        className="border rounded-lg px-3 py-1.5 text-sm ml-2 w-24" 
      />
    </div>
    <button
  onClick={loadRevenue}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
>
  Xem thống kê
</button>
  </div>
)}
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={tab === 'day' ? 'ngay' : tab === 'month' ? 'thang' : 'nam'} 
  tick={{ fontSize: 12 }} 
  stroke="#94a3b8"
  tickFormatter={(value) => tab === 'month' ? `Tháng ${value}` : value} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v) => VND(v)} />
              <Area type="monotone" dataKey="doanhThu" stroke="#3b82f6" fill="url(#revGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-gray-400 py-10">Chưa có dữ liệu</p>}
      </div>

      {/* 2 cột: Sản phẩm bán chạy + Biểu đồ tròn đơn hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4">Sản phẩm bán chạy</h2>
          {bestSelling.length > 0 ? (
            <div className="space-y-3">
              {bestSelling.map((p, i) => (
                <div key={p.maSanPham || i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-6">#{i + 1}</span>
                  <img src={p.urlAnh || 'https://placehold.co/40x40/e2e8f0/475569?text=P'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((p.soLuongDaBan ?? 0) / (bestSelling[0]?.soLuongDaBan || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 shrink-0">{p.soLuongDaBan ?? 0} cái</span>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-400 py-8">Chưa có dữ liệu</p>}
        </div>

        {/* Biểu đồ tròn đơn hàng */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4">Phân loại đơn hàng</h2>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => v + ' đơn'} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-10">Chưa có dữ liệu</p>}
        </div>
      </div>
    </div>
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}