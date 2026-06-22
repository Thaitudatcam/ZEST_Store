import { useState, useEffect } from "react";
import { getOrders, cancelOrder } from "../api/orders";
import LoadingSpinner from "../components/LoadingSpinner";
import { Package, XCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { VND } from "../components/ProductCard";

const statusColor = {
  1: "bg-yellow-100 text-yellow-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-purple-100 text-purple-800",
  4: "bg-green-100 text-green-800",
  5: "bg-red-100 text-red-800",
  6: "bg-teal-100 text-teal-800",
  7: "bg-orange-100 text-orange-800",
  8: "bg-gray-200 text-gray-700",
};
const statusText = {
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang giao",
  4: "Đã giao",
  5: "Đã hủy",
  6: "Hoàn thành",
  7: "Yêu cầu trả hàng",
  8: "Đã trả hàng",
};

export default function Orders() {
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
    await cancelOrder(id);
    load();
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
                  <p className="text-sm text-gray-500">
                    {o.ngayDat
                      ? new Date(o.ngayDat).toLocaleDateString("vi-VN")
                      : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${statusColor[o.trangThaiDon] || "bg-gray-100"}`}
                >
                  {statusText[o.trangThaiDon] || o.trangThaiDon}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-blue-700">
                  {VND(o.tongTien || 0)}
                </p>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
              {o.trangThaiDon === 1 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancel(o.maDonHang);
                  }}
                  className="mt-2 text-sm text-red-500 hover:underline flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" /> Hủy đơn
                </button>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
