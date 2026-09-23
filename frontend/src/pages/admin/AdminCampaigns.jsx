import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCampaigns, deleteCampaign, toggleCampaignStatus, launchCampaign } from '../../api/admin'
import { Plus, PenSquare, Search, Calendar, RefreshCw } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

const CAMPAIGN_STATUS = {
  paused: { label: 'Đã tắt', color: 'bg-bordeaux/10 text-bordeaux border-bordeaux/20' },
  upcoming: { label: 'Sắp diễn ra', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  active: { label: 'Đang quảng', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ended: { label: 'Đã kết thúc', color: 'bg-stone/10 text-stone border-stone/20' },
}

export function getCampaignStatus(c) {
  if (Number(c.trangThai) !== 1) return 'paused'
  const now = new Date()
  const start = c.ngayBatDau ? new Date(c.ngayBatDau) : null
  const end = c.ngayKetThuc ? new Date(c.ngayKetThuc) : null
  if (end && now > end) return 'ended'
  if (start && now < start) return 'upcoming'
  return 'active'
}

export default function AdminCampaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [launching, setLaunching] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmLaunch, setConfirmLaunch] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  const load = () => {
    getCampaigns().then(setCampaigns).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    setConfirmToggle(null)
    try {
      await toggleCampaignStatus(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi')
    }
  }

  const handleLaunch = async (id) => {
    setConfirmLaunch(null)
    setLaunching(id)
    try {
      await launchCampaign(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi phát động')
    } finally { setLaunching(null) }
  }

  const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
  const fmtGiam = (c) => {
    if (c.giaTriGiam == null) return '—'
    return Number(c.kieuGiamGia) === 2 ? VND(c.giaTriGiam) : `${c.giaTriGiam}%`
  }
  const fmtQT = (id) => (id == null ? '—' : `DGG${String(id).padStart(2, '0')}`)

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const q = search.trim().toLowerCase()
      if (q && !(c.tenChuongTrinh || '').toLowerCase().includes(q) && !fmtQT(c.maChuongTrinh).toLowerCase().includes(q)) return false
      if (filterStatus) {
        const st = getCampaignStatus(c)
        if (st !== filterStatus) return false
      }
      if (filterDateStart) {
        const d = c.ngayBatDau ? new Date(c.ngayBatDau) : null
        if (!d || d < new Date(filterDateStart)) return false
      }
      if (filterDateEnd) {
        const d = c.ngayKetThuc ? new Date(c.ngayKetThuc) : null
        if (!d || d > new Date(filterDateEnd + 'T23:59:59')) return false
      }
      return true
    })
  }, [campaigns, search, filterStatus, filterDateStart, filterDateEnd])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">QUẢN LÝ ĐỢT GIẢM GIÁ</h1>

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-stone/10 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo mã hoặc tên..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone" />
              <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)}
                className="bg-white border border-stone/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" />
              <span className="text-stone text-sm">→</span>
              <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)}
                className="bg-white border border-stone/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-stone/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60">
              <option value="">Trạng thái (Tất cả)</option>
              <option value="paused">Đã tắt</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="active">Đang quảng</option>
              <option value="ended">Đã kết thúc</option>
            </select>
            {(search || filterStatus || filterDateStart || filterDateEnd) && (
              <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterDateStart(''); setFilterDateEnd('') }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone hover:text-bordeaux border border-stone/20 rounded-xl hover:bg-bordeaux/5 transition">
                <RefreshCw className="h-3 w-3" /> Đặt lại
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={() => navigate('/admin/campaigns/create')}
              className="bg-gold text-noir px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold-hover flex items-center gap-2 transition">
              <Plus className="h-4 w-4" /> Thêm đợt giảm
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-center px-4 py-3 font-semibold text-stone w-12">STT</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">MÃ</th>
                <th className="text-left px-4 py-3 font-semibold text-stone">TÊN</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">GIÁ TRỊ</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">BẮT ĐẦU</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">KẾT THÚC</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">TRẠNG THÁI</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCampaigns.map((c, idx) => {
                const status = getCampaignStatus(c)
                const statusDef = CAMPAIGN_STATUS[status]
                return (
                  <tr key={c.maChuongTrinh} className="hover:bg-ivory-100">
                    <td className="px-4 py-3 text-center text-xs text-stone">{idx + 1}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-stone">{fmtQT(c.maChuongTrinh)}</td>
                    <td className="px-4 py-3 font-medium">{c.tenChuongTrinh}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gold">{fmtGiam(c)}</td>
                    <td className="px-4 py-3 text-center text-stone text-xs">
                      {c.ngayBatDau ? new Date(c.ngayBatDau).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-stone text-xs">
                      {c.ngayKetThuc ? new Date(c.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusDef.color}`}>
                        {statusDef.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setConfirmToggle(c.maChuongTrinh)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${c.trangThai === 1 ? 'bg-emerald-deep' : 'bg-stone/30'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition shadow-sm ${c.trangThai === 1 ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                        </button>
                        <button onClick={() => navigate(`/admin/campaigns/${c.maChuongTrinh}/edit`)} title="Sửa"
                          className="p-1.5 text-gold hover:bg-gold/10 rounded-lg transition">
                          <PenSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredCampaigns.length === 0 && <p className="text-center text-stone py-8">Không có đợt giảm giá nào</p>}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận"
        message="Xóa đợt giảm giá này?"
        confirmText="Xóa"
        onConfirm={async () => {
          try {
            await deleteCampaign(confirmDelete)
            setConfirmDelete(null)
            load()
          } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa')
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmToggle !== null}
        title="Đổi trạng thái"
        message="Bạn có chắc muốn đổi trạng thái của đợt giảm giá này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
      <ConfirmDialog
        open={confirmLaunch !== null}
        title="Phát động chương trình"
        message="Bạn có chắc muốn phát động chương trình này ngay bây giờ?"
        confirmText="Phát động"
        variant="gold"
        onConfirm={() => handleLaunch(confirmLaunch)}
        onCancel={() => setConfirmLaunch(null)}
      />
    </div>
  )
}
