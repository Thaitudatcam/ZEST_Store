import { useState, useEffect } from "react";
import { getOrders, cancelOrder } from "../api/orders";
import LoadingSpinner from "../components/LoadingSpinner";
import { Package, XCircle, ChevronRight, ShoppingBag, CheckCircle, Truck, Home } from "lucide-react";
import { Link } from "react-router-dom";
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export { VND };
