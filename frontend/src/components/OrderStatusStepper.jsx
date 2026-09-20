import { Check, Home, Package, ShoppingBag, Truck, XCircle } from 'lucide-react'

const NORMAL_STEPS = [
  { status: 1, label: 'Chờ xác nhận', icon: ShoppingBag },
  { status: 2, label: 'Đã xác nhận', icon: Check },
  { status: 3, label: 'Chờ lấy hàng', icon: Package },
  { status: 4, label: 'Chờ giao hàng', icon: Truck },
  { status: 6, label: 'Giao hàng thành công', icon: Home },
]

const STATUS_LABELS = {
  1: 'Chờ xác nhận',
  2: 'Đã xác nhận',
  3: 'Chờ lấy hàng',
  4: 'Chờ giao hàng',
  5: 'Đã hủy',
  6: 'Giao hàng thành công',
  9: 'Giao hàng không thành công',
}

const SPECIAL_STATUSES = new Set([5, 9])

const toStatus = (status) => {
  const value = Number(status)
  return Number.isFinite(value) ? value : null
}

const formatTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('vi-VN')
}

function historyForStatus(history, status) {
  return (history || []).find((entry) => toStatus(entry.trangThaiMoi) === status)
}

function updaterName(entry) {
  if (!entry?.nguoiCapNhat) return null
  if (typeof entry.nguoiCapNhat === 'string') return entry.nguoiCapNhat
  return entry.nguoiCapNhat.hoTen || entry.nguoiCapNhat.tenDangNhap || null
}

/**
 * Customer-facing order progress. Future steps remain visible but muted so
 * customers can understand what will happen next.
 */
export default function OrderStatusStepper({ currentStatus, history = [], loaiDonHang }) {
  const current = toStatus(currentStatus)
  const isPos = Number(loaiDonHang) === 2
  const steps = isPos
    ? [NORMAL_STEPS[0], NORMAL_STEPS[NORMAL_STEPS.length - 1]]
    : NORMAL_STEPS
  const special = SPECIAL_STATUSES.has(current)

  const normalHistory = history
    .map((entry) => toStatus(entry.trangThaiMoi))
    .filter((status) => status !== null && !SPECIAL_STATUSES.has(status))
  const currentIndex = steps.findIndex((step) => step.status === current)
  const reachedIndex = special
    ? Math.max(-1, ...normalHistory.map((status) => steps.findIndex((step) => step.status === status)))
    : Math.max(currentIndex, -1)

  const renderMeta = (status) => {
    const entry = historyForStatus(history, status)
    const time = formatTime(entry?.thoiGian)
    const updater = updaterName(entry)
    if (!time && !updater) return null
    return (
      <div className="mt-1 space-y-0.5 text-[10px] leading-tight text-stone sm:text-[11px]">
        {time && <p>{time}</p>}
        {updater && <p className="truncate max-w-[130px] mx-auto">{updater}</p>}
      </div>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-stone/10 shadow-sm p-4 sm:p-6 mb-6" aria-label="Tiến trình đơn hàng">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-1 h-6 rounded-full bg-gold" />
        <h2 className="text-base sm:text-lg font-bold text-ink">Trạng thái đơn hàng</h2>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-fit px-2 sm:px-4">
          <div className="flex items-start justify-center">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCurrent = !special && step.status === current
              const isReached = index <= reachedIndex
              return (
                <div key={step.status} className="flex items-start">
                  {index > 0 && (
                    <span className={`mt-[22px] h-0.5 w-8 shrink-0 sm:mt-6 sm:w-10 ${index <= reachedIndex ? 'bg-gold' : 'bg-stone/20'}`} aria-hidden="true" />
                  )}
                  <div className="flex w-[132px] shrink-0 flex-col items-center text-center sm:w-[140px]">
                    <div className="flex h-12 items-center justify-center">
                      <div
                        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-12 sm:w-12
                          ${isCurrent
                            ? 'border-gold bg-gold text-noir ring-4 ring-gold/20'
                            : isReached
                              ? 'border-gold bg-gold text-noir'
                              : 'border-stone/25 bg-white text-stone/50'}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                    <p className={`mt-2 min-h-[16px] whitespace-nowrap text-[11px] font-semibold leading-tight sm:text-xs ${isCurrent ? 'text-gold-hover' : isReached ? 'text-ink' : 'text-stone/60'}`}>
                      {step.label}
                    </p>
                    {renderMeta(step.status)}
                  </div>
                </div>
              )
            })}

            {special && (
              <div className="flex items-start">
                <span className="mt-[22px] h-0.5 w-8 shrink-0 bg-bordeaux/40 sm:mt-6 sm:w-10" aria-hidden="true" />
                <div className="flex w-[132px] shrink-0 flex-col items-center text-center sm:w-[140px]">
                  <div className="flex h-12 items-center justify-center">
                    <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-bordeaux/40 bg-bordeaux/10 text-bordeaux sm:h-12 sm:w-12">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <p className="mt-2 min-h-[16px] whitespace-nowrap text-[11px] font-semibold leading-tight text-bordeaux sm:text-xs">{STATUS_LABELS[current]}</p>
                  {renderMeta(current)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
