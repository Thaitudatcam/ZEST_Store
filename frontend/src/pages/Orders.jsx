import { useState, useEffect, useMemo } from "react";
import { getOrders, getOrderDetail, cancelOrder } from "../api/orders";
import { addToCart } from "../api/cart";
import { addReview } from "../api/reviews";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import { Package, XCircle, ShoppingBag, CheckCircle, Truck, Home, ShoppingCart, Loader, Star, MessageSquare, Clock, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { VND } from "../components/ProductCard";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 1, label: 'Chờ xác nhận' },
  { key: 2, label: 'Đã xác nhận' },
  { key: 4, label: 'Chờ giao' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 6, label: 'Hoàn thành' },
  { key: 5, label: 'Đã hủy' },
  { key: 9, label: 'Giao thất bại' },
];

export default function Orders() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refreshCount } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchCode, setSearchCode] = useState('');
  const [buyingOrders, setBuyingOrders] = useState(new Set());
  const [reviewModal, setReviewModal] = useState({ open: false, orderId: null, items: [], loading: false });
  const [reviewData, setReviewData] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverStar, setHoverStar] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmReview, setConfirmReview] = useState(false);
  const load = () =>
    getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeFilter !== 'all') {
      if (activeFilter === 'delivering') {
        list = list.filter(o => o.trangThaiDon === 3 || o.trangThaiDon === 4);
      } else {
        list = list.filter(o => o.trangThaiDon === activeFilter);
      }
    }
    if (searchCode.trim()) {
      const q = searchCode.trim().toLowerCase();
      list = list.filter(o => {
        const code = (o.maDonHangCode || '').toLowerCase();
        const id = String(o.maDonHang);
        return code.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [orders, activeFilter, searchCode]);

  const handleCancel = async (id) => {
    setConfirmCancel(null);
    try {
      await cancelOrder(id);
      load();
      toast.success("Đã hủy đơn hàng");
    } catch {
      toast.error("Hủy đơn thất bại");
    }
  };

  const handleBuyAgain = async (orderId, e) => {
    e.preventDefault();
    setBuyingOrders(prev => new Set([...prev, orderId]));
    try {
      const detail = await getOrderDetail(orderId);
      const items = detail.items || [];
      let count = 0;
      for (const item of items) {
        const maBienThe = item.bienThe?.maBienThe;
        if (maBienThe) {
          await addToCart({ maBienThe, soLuong: 1 });
          count++;
        }
      }
      refreshCount()
      toast.success(
        <div className="flex items-center gap-2">
          <span>Đã thêm {count} sản phẩm vào giỏ hàng!</span>
          <button onClick={() => navigate('/cart')} className="text-gold font-semibold underline whitespace-nowrap">Xem giỏ</button>
        </div>
      );
    } catch {
      toast.error("Mua lại thất bại");
    } finally {
      setBuyingOrders(prev => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  };

  const openReview = async (orderId, e) => {
    e.preventDefault();
    setReviewModal({ open: true, orderId, items: [], loading: true });
    try {
      const detail = await getOrderDetail(orderId);
      const items = detail.items || [];
      const initial = {};
      items.forEach(item => {
        const key = item.maMucDonHang;
        initial[key] = { soSao: 5, binhLuan: '' };
      });
      setReviewData(initial);
      setReviewModal(prev => ({ ...prev, items, loading: false }));
    } catch {
      toast.error("Không thể tải thông tin đánh giá");
      setReviewModal({ open: false, orderId: null, items: [], loading: false });
    }
  };

  const closeReview = (e) => {
    if (e) e.preventDefault();
    setReviewModal({ open: false, orderId: null, items: [], loading: false });
    setReviewData({});
  };

  const setReviewRating = (key, soSao) => {
    setReviewData(prev => ({ ...prev, [key]: { ...prev[key], soSao } }));
  };

  const setReviewComment = (key, binhLuan) => {
    setReviewData(prev => ({ ...prev, [key]: { ...prev[key], binhLuan } }));
  };

  const handleSubmitReviews = async () => {
    setConfirmReview(false);
    setSubmittingReview(true);
    try {
      const { items, orderId } = reviewModal;
      for (const item of items) {
        const data = reviewData[item.maMucDonHang];
        if (!data || !data.soSao) continue;
        const variant = item.bienThe || {};
        const product = variant.sanPham || {};
        if (product.maSanPham) {
          await addReview({
            maSanPham: product.maSanPham,
            maDonHang: orderId,
            maBienThe: variant.maBienThe,
            soSao: data.soSao,
            binhLuan: data.binhLuan,
          });
        }
      }
      toast.success("Đánh giá thành công!");
      closeReview();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-noir via-noir/95 to-noir/80 rounded-2xl p-6 md:p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold text-ivory mb-1">ĐƠN HÀNG CỦA TÔI</h1>
          <p className="text-stone-light/60 text-sm">Quản lý và theo dõi trạng thái đơn hàng của bạn</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border
              ${activeFilter === tab.key
                ? 'bg-gold text-noir border-gold shadow-sm'
                : 'bg-white text-stone border-stone/15 hover:border-gold/40 hover:text-ink'
              }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="relative ml-2 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Tra cứu đơn"
            className="pl-8 pr-3 py-2 text-xs border border-stone/15 rounded-full w-32 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-stone">
          <Package className="h-16 w-16 mx-auto mb-4 text-stone" />
          <p className="mb-4">{orders.length === 0 ? 'Chưa có đơn hàng' : 'Không tìm thấy đơn hàng phù hợp'}</p>
          {orders.length === 0 && (
            <Link to="/products" className="text-gold font-semibold hover:underline">Mua sắm ngay</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <Link
              to={`/orders/${o.maDonHang}`}
              key={o.maDonHang}
              className="bg-white rounded-xl border border-stone/10 p-5 block hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ivory flex items-center justify-center">
                    <Package className="h-5 w-5 text-stone" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{o.maDonHangCode || `#${o.maDonHang}`}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-stone" />
                      <span className="text-[11px] text-stone">
                        {o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={o.trangThaiDon} loaiDonHang={o.loaiDonHang} />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3 pl-[52px]">
                <div className="flex items-center gap-2">
                  <span className="text-stone text-xs">Người nhận:</span>
                  <span className="font-medium text-ink text-xs">{o.tenNguoiNhan || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone text-xs">Số điện thoại:</span>
                  <span className="font-medium text-ink text-xs">{o.sdtNguoiNhan || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone text-xs">Sản phẩm:</span>
                  <span className="font-medium text-ink text-xs">{o.soLuongSanPham || o.items?.length || 1} loại sản phẩm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone text-xs">Thanh toán:</span>
                  <span className="font-medium text-xs">
                    {{1:'COD',2:'VNPay',3:'VietQR',4:'ZaloPay'}[o.phuongThucThanhToan] || 'Online'}{' '}
                    {o.trangThaiThanhToan === 2
                      ? <span className="text-emerald-deep">Đã thanh toán</span>
                      : <span className="text-gold">Chưa thanh toán</span>
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pl-[52px] pt-2 border-t border-stone/10">
                <div className="flex items-center gap-2">
                  {(o.trangThaiDon === 1 || o.trangThaiDon === 2 || o.trangThaiDon === 3) && (
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmCancel(o.maDonHang); }}
                      className="text-xs text-bordeaux hover:underline flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Hủy đơn
                    </button>
                  )}
                  {o.trangThaiDon === 6 && (
                    <>
                      <button
                        onClick={(e) => handleBuyAgain(o.maDonHang, e)}
                        disabled={buyingOrders.has(o.maDonHang)}
                        className="text-xs text-gold hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {buyingOrders.has(o.maDonHang) ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                        Mua lại
                      </button>
                      <button
                        onClick={(e) => openReview(o.maDonHang, e)}
                        className="text-xs text-gold hover:underline flex items-center gap-1"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Đánh giá
                      </button>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone">Tổng số tiền:</p>
                  <p className="text-sm font-bold text-gold">{VND(o.tongTien || 0)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {reviewModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeReview}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h3 className="font-bold text-lg">Đánh giá sản phẩm</h3>
              <button onClick={closeReview} className="text-stone hover:text-stone text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {reviewModal.loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : reviewModal.items.length === 0 ? (
                <p className="text-center text-stone py-10">Không có sản phẩm nào để đánh giá</p>
              ) : (
                reviewModal.items.map((item) => {
                  const key = item.maMucDonHang;
                  const variant = item.bienThe || {};
                  const product = variant.sanPham || {};
                  const anh = variant.urlAnh || product.urlAnhDaiDien || '';
                  const data = reviewData[key] || { soSao: 5, binhLuan: '' };
                  const currentStar = hoverStar[key] || data.soSao;
                  const starLabels = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];
                  return (
                    <div key={key} className="bg-ivory rounded-xl border border-stone/10 shadow-sm p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-ivory-100 rounded-xl overflow-hidden shrink-0 ring-1 ring-gray-100">
                          <img src={anh} alt="" className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/475569?text=Polo' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-ink truncate">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                          <p className="text-xs text-stone mt-0.5">
                            {[variant.kichCo?.kichCo, variant.mauSac?.mauSac].filter(Boolean).join(' - ') || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button"
                              onClick={() => setReviewRating(key, star)}
                              onMouseEnter={() => setHoverStar(prev => ({ ...prev, [key]: star }))}
                              onMouseLeave={() => setHoverStar(prev => { const n = { ...prev }; delete n[key]; return n; })}
                              className={`transition-all duration-150 ${star <= currentStar ? 'scale-110' : 'scale-100 hover:scale-110'}`}>
                              <Star className={`h-6 w-6 transition-all duration-150 ${
                                star <= currentStar
                                  ? 'fill-amber-400 text-gold drop-shadow-sm'
                                  : 'text-stone hover:text-gold/30'
                              }`} />
                            </button>
                          ))}
                        </div>
                        <p className="text-xs font-medium mt-1.5 ml-0.5" style={{ color: currentStar >= 4 ? '#2563eb' : currentStar >= 3 ? '#d97706' : '#ef4444' }}>
                          {starLabels[currentStar]}
                        </p>
                      </div>

                      <div className="relative">
                        <textarea value={data.binhLuan} onChange={(e) => {
                          if (e.target.value.length <= 1000) setReviewComment(key, e.target.value);
                        }}
                          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                          className="w-full bg-ivory-100 border border-stone/20 rounded-xl p-3 pr-14 text-sm min-h-[72px] focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-gold/30 focus:bg-ivory resize-none transition-all duration-200 placeholder:text-stone" />
                        <span className="absolute bottom-2 right-3 text-[10px] text-stone select-none">{data.binhLuan.length}/1000</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-3 p-5 border-t shrink-0">
              <button onClick={closeReview} className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-ivory-100 transition">
                Hủy
              </button>
              <button onClick={() => setConfirmReview(true)} disabled={submittingReview || reviewModal.items.length === 0}
                className="flex-1 bg-gold text-noir rounded-xl py-2.5 text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-1">
                {submittingReview ? <Loader className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Hủy đơn hàng"
        message="Bạn chắc chắn muốn hủy đơn hàng này?"
        confirmText="Hủy đơn"
        onConfirm={() => handleCancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
      <ConfirmDialog
        open={confirmReview}
        title="Gửi đánh giá"
        message="Bạn chắc chắn muốn gửi đánh giá cho các sản phẩm đã chọn?"
        confirmText="Gửi đánh giá"
        variant="gold"
        loading={submittingReview}
        onConfirm={handleSubmitReviews}
        onCancel={() => setConfirmReview(false)}
      />
    </div>
  );
}

export { VND };
