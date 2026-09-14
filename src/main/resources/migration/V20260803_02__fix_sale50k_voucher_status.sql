-- Đơn 106 (POS, 2026-08-01) đã dùng SALE50K nhưng voucher (user 1, mã 2)
-- còn DA_NHAN → đánh dấu DA_DUNG để ví và gợi ý áp mã nhất quán.
UPDATE voucher_nguoi_dung
SET trang_thai = 2,
    ngay_su_dung = '2026-08-01 18:02:59.3891437'
WHERE ma_voucher_nguoi_dung = 14
  AND trang_thai = 1;
