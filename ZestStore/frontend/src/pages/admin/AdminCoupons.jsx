import { useState, useEffect } from "react";
import { getCoupons, createCoupon, deleteCoupon , filterCoupons} from "../../api/admin";
import { Plus, Trash2 ,Filter, X } from "lucide-react";

const PAGE_SIZE = 15

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({
    ngayBatDau: "",
    ngayKetThuc: "",
    kieuGiamGia: "",
    giaTriGiam: "",
  });
  const [page, setPage] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
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

  const load = (filterParams = {}) => {
  const hasFilter = Object.values(filterParams).some((v) => v !== "");

  if (hasFilter) {
    const params = new URLSearchParams();
    if (filterParams.ngayBatDau) params.append("ngayBatDau", filterParams.ngayBatDau + "T00:00:00");
    if (filterParams.ngayKetThuc) params.append("ngayKetThuc", filterParams.ngayKetThuc + "T23:59:59");
    if (filterParams.kieuGiamGia) params.append("kieuGiamGia", filterParams.kieuGiamGia);
    if (filterParams.giaTriGiam) params.append("giaTriGiam", filterParams.giaTriGiam);

    filterCoupons(params.toString()).then(setCoupons).catch(() => {});
  } else {
    // Nhánh này phải chạy khi mới vào trang
    getCoupons().then(setCoupons).catch(() => {});
  }
};

useEffect(() => { load(); }, []); // Gọi load() không tham số = lấy tất cả
const handleFilter = () => {
  if (filter.ngayBatDau && filter.ngayKetThuc) {
    if (new Date(filter.ngayBatDau) > new Date(filter.ngayKetThuc)) {
      alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!"); return;
    }
  }
  if (filter.giaTriGiam && Number(filter.giaTriGiam) < 0) {
    alert("Giá trị giảm không được âm!"); return;
  }
  if(filter.giaTriGiam && Number(filter.giaTriGiam) >100000000){
    alert("Giá trị giảm quá lớn!"); return;
  }
  if (filter.kieuGiamGia === "1" && filter.giaTriGiam && Number(filter.giaTriGiam) > 100) {
    alert("Phần trăm giảm không được vượt quá 100%!"); return;
  }
  load(filter);
};

const handleResetFilter = () => {
  const reset = { ngayBatDau: "", ngayKetThuc: "", kieuGiamGia: "", giaTriGiam: "" };
  setFilter(reset);
  load({});
};

const hasFilter = Object.values(filter).some((v) => v !== "");

const validate = () => {
  if (!form.maCode.trim()) {
    alert("Vui lòng nhập mã code!"); return false;
  }
  if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0) {
    alert("Giá trị giảm phải lớn hơn 0!"); return false;
  }
  if (form.kieuGiamGia === 1 && Number(form.giaTriGiam) > 100) {
    alert("Phần trăm giảm không được vượt quá 100%!"); return false;
  }
  if (!form.ngayBatDau) {
    alert("Vui lòng chọn ngày bắt đầu!"); return false;
  }
  if (!form.ngayKetThuc) {
    alert("Vui lòng chọn ngày kết thúc!"); return false;
  }
  if (new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) {
    alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!"); return false;
  }
  if (new Date(form.ngayBatDau) < new Date(new Date().toDateString())) {
    alert("Ngày bắt đầu không được là ngày quá khứ!"); return false;
  }
  if (form.giaTriDonToiThieu && Number(form.giaTriDonToiThieu) < 0) {
    alert("Giá trị đơn tối thiểu không được âm!"); return false;
  }
  if (form.soLuong && Number(form.soLuong) <= 0) {
    alert("Số lượng phải lớn hơn 0!"); return false;
  }
  if (form.kieuGiamGia === 1 && form.giaTriGiamToiDa && Number(form.giaTriGiamToiDa) <= 0) {
    alert("Giá trị giảm tối đa phải lớn hơn 0!"); return false;
  }
  return true;
}

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validate()) return;
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCoupon(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
       alert(err.response?.data?.message || err.message || "Lỗi xóa coupon");
      console.error("Delete error:", err);
    }
  };

  useEffect(() => { setPage(0) }, [coupons.length])
  const totalPages = Math.ceil(coupons.length / PAGE_SIZE)
  const paged = coupons.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
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
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
  <div className="flex items-center gap-2 mb-3">
    <Filter className="h-4 w-4 text-gray-500" />
    <span className="font-semibold text-sm text-gray-700">Bộ lọc</span>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div>
      <label className="text-xs text-gray-500">Ngày bắt đầu</label>
      <input
        type="date"
        value={filter.ngayBatDau}
        onChange={(e) => setFilter({ ...filter, ngayBatDau: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="text-xs text-gray-500">Ngày kết thúc</label>
      <input
        type="date"
        value={filter.ngayKetThuc}
        onChange={(e) => setFilter({ ...filter, ngayKetThuc: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="text-xs text-gray-500">Kiểu giảm</label>
      <select
        value={filter.kieuGiamGia}
        onChange={(e) => setFilter({ ...filter, kieuGiamGia: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả</option>
        <option value="1">Giảm theo %</option>
        <option value="2">Giảm tiền mặt</option>
      </select>
    </div>
    <div>
      <label className="text-xs text-gray-500">Giá trị giảm</label>
      <input
        type="number"
        value={filter.giaTriGiam}
        onChange={(e) => setFilter({ ...filter, giaTriGiam: e.target.value })}
        placeholder="Nhập giá trị..."
        className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
  <div className="flex gap-2 mt-3">
    <button
      onClick={handleFilter}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
    >
      <Filter className="h-4 w-4" /> Lọc
    </button>
    {hasFilter && (
      <button
        onClick={handleResetFilter}
        className="border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-600"
      >
        <X className="h-4 w-4" /> Xóa lọc
      </button>
    )}
  </div>
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
                {paged.map((c) => (
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
                        onClick={() => setConfirmDelete(c.maPhieuGiamGia)}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
            </div>
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

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Xóa mã giảm giá này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
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
