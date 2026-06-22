import { useState, useEffect } from "react";
import { getCoupons, createCoupon, deleteCoupon } from "../../api/admin";
import { Plus, Trash2 } from "lucide-react";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    maCode: "",
    kieuGiamGia: 1,
    giaTriGiam: "",
    giaTriDonToiThieu: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    soLuong: "",
    giaTriGiamToiDa: "",
  });

  const load = () =>
    getCoupons()
      .then(setCoupons)
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCoupon({
        maCode: form.maCode,
        kieuGiamGia: form.kieuGiamGia,
        giaTriGiam: Number(form.giaTriGiam),
        giaTriDonToiThieu: form.giaTriDonToiThieu
          ? Number(form.giaTriDonToiThieu)
          : null,
        ngayBatDau: form.ngayBatDau ? form.ngayBatDau + "T00:00:00" : null,
        ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + "T00:00:00" : null,
        soLuong: form.soLuong ? Number(form.soLuong) : null,
        giaTriGiamToiDa: form.kieuGiamGia === 2 ? null : (form.giaTriGiamToiDa ? Number(form.giaTriGiamToiDa) : null)
      });
      setShowForm(false);
      setForm({
        maCode: "",
        kieuGiamGia: 1,
        giaTriGiam: "",
        giaTriDonToiThieu: "",
        ngayBatDau: "",
        ngayKetThuc: "",
        soLuong: "",
        giaTriGiamToiDa: "",
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa mã này?")) return;
    try {
      await deleteCoupon(id);
      load();
    } catch {}
  };
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm mã
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600">
                    Mã
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Giảm
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Số lượng
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Giảm tối đa
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Ngày BĐ
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Ngày KT
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">
                    Trạng thái
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c) => (
                  <tr key={c.maPhieuGiamGia} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono font-semibold text-blue-700">
                      {c.maCode}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.kieuGiamGia === 1
                        ? `${c.giaTriGiam}%`
                        : VND(c.giaTriGiam)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.soLuong ?? "∞"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.kieuGiamGia === 2 ? '—' : c.giaTriGiamToiDa ? VND(c.giaTriGiamToiDa) : '∞'}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-500 text-xs">
                      {fmtDate(c.ngayBatDau)}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-500 text-xs">
                      {fmtDate(c.ngayKetThuc)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          c.trangThai === 1
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.trangThai === 1
                          ? "Còn hoạt động"
                          : "Ngừng hoạt động"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleDelete(c.maPhieuGiamGia)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {coupons.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Chưa có mã giảm giá
            </p>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit">
            <h2 className="font-semibold mb-4">Thêm mã giảm giá</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.maCode}
                onChange={(e) =>
                  setForm({ ...form, maCode: e.target.value.toUpperCase() })
                }
                placeholder="Mã code"
                required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.kieuGiamGia}
                onChange={(e) =>
                  setForm({ ...form, kieuGiamGia: Number(e.target.value) })
                }
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Giảm theo %</option>
                <option value={2}>Giảm tiền mặt</option>
              </select>
              <input
                type="number"
                value={form.giaTriGiam}
                onChange={(e) =>
                  setForm({ ...form, giaTriGiam: e.target.value })
                }
                placeholder={
                  form.kieuGiamGia === 1
                    ? "Phần trăm giảm (vd: 10)"
                    : "Số tiền giảm"
                }
                required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={form.giaTriDonToiThieu}
                onChange={(e) =>
                  setForm({ ...form, giaTriDonToiThieu: e.target.value })
                }
                placeholder="Giá trị đơn tối thiểu"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={form.soLuong}
                onChange={(e) => setForm({ ...form, soLuong: e.target.value })}
                placeholder="Số lượng mã (để trống = không giới hạn)"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {form.kieuGiamGia === 1 && (
                <input
                  type="number"
                  value={form.giaTriGiamToiDa}
                  onChange={(e) =>
                    setForm({ ...form, giaTriGiamToiDa: e.target.value })
                  }
                  placeholder="Giá trị giảm tối đa (để trống = không giới hạn)"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.ngayBatDau}
                    onChange={(e) =>
                      setForm({ ...form, ngayBatDau: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.ngayKetThuc}
                    onChange={(e) =>
                      setForm({ ...form, ngayKetThuc: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function VND(n) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);
  } catch {
    return n;
  }
}
