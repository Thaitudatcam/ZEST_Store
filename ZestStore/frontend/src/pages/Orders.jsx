import { useState, useEffect } from "react";
import { getOrders, getOrderDetail, cancelOrder } from "../api/orders";
import { addToCart } from "../api/cart";
import { addReview } from "../api/reviews";
import LoadingSpinner from "../components/LoadingSpinner";
import { Package, XCircle, ChevronRight, ShoppingBag, CheckCircle, Truck, Home, ShoppingCart, Loader, Star, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { VND } from "../components/ProductCard";
import { useToast } from "../context/ToastContext";

const STEP_ICONS = { 1: ShoppingBag, 2: CheckCircle, 3: Package, 4: Truck, 6: Home };

function OrderMiniStepper({ status }) {
  const steps = [1, 2, 3, 4, 6];
  const currentIdx = steps.indexOf(status);
  const isSpecial = [5, 7, 8].includes(status);

  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s, i) => {
        const Icon = STEP_ICONS[s];
        const filled = isSpecial || i <= currentIdx;
        const isCurrent = !isSpecial && i === currentIdx;
        return (
          <div key={s} className="flex items-center">
            {i > 0 && <div className={`w-3 sm:w-5 h-0.5 ${filled ? 'bg-blue-500' : 'bg-gray-200'}`} />}
            <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300
              ${isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-300' : filled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-300'}`}>
              <Icon className="h-3 w-3" />
            </div>
          </div>
        );
      })}
      {isSpecial && (
        <span className="ml-2 text-xs font-semibold text-red-600">{status === 5 ? 'Đã hủy' : status === 7 ? 'Trả hàng' : 'Đã trả hàng'}</span>
      )}
    </div>
  );
}

export default function Orders() {
  const toast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingOrders, setBuyingOrders] = useState(new Set());
  const [reviewModal, setReviewModal] = useState({ open: false, orderId: null, items: [], loading: false });
  const [reviewData, setReviewData] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverStar, setHoverStar] = useState({});
  const load = () =>
    getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
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
      toast.success(
        <div className="flex items-center gap-2">
          <span>Đã thêm {count} sản phẩm vào giỏ hàng!</span>
          <button onClick={() => navigate('/cart')} className="text-blue-700 font-semibold underline whitespace-nowrap">Xem giỏ</button>
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="mb-4">Chưa có đơn hàng</p>
          <Link
            to="/products"
            className="text-blue-700 font-semibold hover:underline"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              to={`/orders/${o.maDonHang}`}
              key={o.maDonHang}
              className="bg-white rounded-xl border p-4 block hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500">
                    Đơn hàng #{o.maDonHang}
                  </p>
                  <p className="text-xs text-gray-400">
                    {o.ngayDat
                      ? new Date(o.ngayDat).toLocaleDateString("vi-VN")
                      : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">
                  {VND(o.tongTien || 0)}
                </span>
              </div>
              <div className="mb-2">
                <OrderMiniStepper status={o.trangThaiDon} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {o.trangThaiDon === 1 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Hủy đơn hàng này?")) handleCancel(o.maDonHang);
                      }}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Hủy đơn
                    </button>
                  )}
                  {o.trangThaiDon === 6 && (
                    <>
                      <button
                        onClick={(e) => handleBuyAgain(o.maDonHang, e)}
                        disabled={buyingOrders.has(o.maDonHang)}
                        className="text-xs text-blue-700 hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {buyingOrders.has(o.maDonHang) ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-3.5 w-3.5" />
                        )}
                        Mua lại
                      </button>
                      <button
                        onClick={(e) => openReview(o.maDonHang, e)}
                        className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Đánh giá
                      </button>
                    </>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {reviewModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeReview}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h3 className="font-bold text-lg">Đánh giá sản phẩm</h3>
              <button onClick={closeReview} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {reviewModal.loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader className="h-6 w-6 animate-spin text-blue-700" />
                </div>
              ) : reviewModal.items.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Không có sản phẩm nào để đánh giá</p>
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
                    <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 ring-1 ring-gray-100">
                          <img src={anh} alt="" className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/475569?text=Polo' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
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
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                  : 'text-gray-200 hover:text-amber-300'
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
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-14 text-sm min-h-[72px] focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 focus:bg-white resize-none transition-all duration-200 placeholder:text-gray-300" />
                        <span className="absolute bottom-2 right-3 text-[10px] text-gray-300 select-none">{data.binhLuan.length}/1000</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-3 p-5 border-t shrink-0">
              <button onClick={closeReview} className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">
                Hủy
              </button>
              <button onClick={handleSubmitReviews} disabled={submittingReview || reviewModal.items.length === 0}
                className="flex-1 bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-1">
                {submittingReview ? <Loader className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { VND };
