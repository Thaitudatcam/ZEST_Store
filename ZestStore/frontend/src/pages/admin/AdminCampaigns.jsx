import { useToast } from '../../context/ToastContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCampaigns, deleteCampaign, toggleCampaignStatus, launchCampaign } from '../../api/admin'
import { Plus, Play, PenSquare, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminCampaigns() {
  const toast = useToast()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [launching, setLaunching] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [confirmLaunch, setConfirmLaunch] = useState(null)

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
      toast.error(err.response?.data?.message || 'Lỗi')
    }
  }

  const handleLaunch = async (id) => {
    setConfirmLaunch(null)
    setLaunching(id)
    try {
      await launchCampaign(id)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi phát động')
    } finally { setLaunching(null) }
  }

  const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
  const fmtGiam = (c) => {
    if (c.giaTriGiam == null) return '—'
    return Number(c.kieuGiamGia) === 2 ? VND(c.giaTriGiam) : `${c.giaTriGiam}%`
  }
  const fmtQT = (id) => (id == null ? '—' : `QT${String(id).padStart(2, '0')}`)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chương trình quà tặng</h1>
        <button onClick={() => navigate('/admin/campaigns/create')}
          className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm chương trình
        </button>
      </div>

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-center px-4 py-3 font-semibold text-stone">STT</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Mã quà tặng</th>
                <th className="text-left px-4 py-3 font-semibold text-stone">Tên chương trình</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Giảm giá</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Ngày BĐ → KT</th>
                <th className="text-center px-4 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-stone"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c, idx) => (
                <tr key={c.maChuongTrinh} className="hover:bg-ivory-100">
                  <td className="px-4 py-3 text-center font-mono text-xs text-stone">{idx + 1}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-stone">{fmtQT(c.maChuongTrinh)}</td>
                  <td className="px-4 py-3 font-medium">{c.tenChuongTrinh}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gold">{fmtGiam(c)}</td>
                  <td className="px-4 py-3 text-center text-stone text-xs">
                    {c.ngayBatDau ? new Date(c.ngayBatDau).toLocaleDateString('vi-VN') : '—'} → {c.ngayKetThuc ? new Date(c.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setConfirmToggle(c.maChuongTrinh)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${c.trangThai === 1 ? 'bg-emerald-deep/100' : 'bg-ivory-100'} cursor-pointer`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-ivory transition ${c.trangThai === 1 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate(`/admin/campaigns/${c.maChuongTrinh}/edit`)} title="Sửa"
                        className="p-1 text-gold hover:bg-gold/10 rounded">
                        <PenSquare className="h-4 w-4" />
                      </button>
                      {c.maPhieuGiamGia && c.loaiTrigger === 2 && c.trangThai === 1 && !c.daChayXong && (
                        <button onClick={() => setConfirmLaunch(c.maChuongTrinh)} disabled={launching === c.maChuongTrinh}
                          className="text-emerald-deep hover:bg-emerald-deep/10 p-1 rounded disabled:opacity-40" title="Phát động ngay">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {c.maPhieuGiamGia && c.loaiTrigger === 2 && c.daChayXong && (
                        <span className="text-[10px] text-stone font-medium">Đã chạy</span>
                      )}
                      <button onClick={() => setConfirmDelete(c.maChuongTrinh)} title="Xóa"
                        className="p-1 text-bordeaux hover:bg-bordeaux/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaigns.length === 0 && <p className="text-center text-stone py-8">Chưa có chương trình quà tặng</p>}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận"
        message="Xóa chương trình quà tặng này?"
        confirmText="Xóa"
        onConfirm={async () => {
          try {
            await deleteCampaign(confirmDelete)
            setConfirmDelete(null)
            load()
          } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi xóa')
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmToggle !== null}
        title="Đổi trạng thái chương trình"
        message="Bạn có chắc muốn đổi trạng thái của chương trình quà tặng này?"
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
      <ConfirmDialog
        open={confirmLaunch !== null}
        title="Phát động chương trình"
        message="Bạn có chắc muốn phát động chương trình quà tặng này ngay bây giờ?"
        confirmText="Phát động"
        variant="gold"
        onConfirm={() => handleLaunch(confirmLaunch)}
        onCancel={() => setConfirmLaunch(null)}
      />
    </div>
  )
}
