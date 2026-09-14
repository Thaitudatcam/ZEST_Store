-- Chặn duplicate voucher_nguoi_dung: 1 tài khoản chỉ được tối đa 1 bản ghi cho cùng 1 mã giảm giá.
-- Trước khi tạo index, xóa các dòng trùng, ưu tiên giữ dòng đã dùng (trang_thai = DA_DUNG) / dòng có id nhỏ nhất.
;WITH dup AS (
    SELECT ma_voucher_nguoi_dung,
           ROW_NUMBER() OVER (
               PARTITION BY ma_nguoi_dung, ma_phieu_giam_gia
               ORDER BY CASE WHEN trang_thai = 2 THEN 0 ELSE 1 END, ma_voucher_nguoi_dung
           ) AS rn
    FROM voucher_nguoi_dung
)
DELETE FROM voucher_nguoi_dung
WHERE ma_voucher_nguoi_dung IN (SELECT ma_voucher_nguoi_dung FROM dup WHERE rn > 1);

CREATE UNIQUE INDEX UQ_voucher_nguoi_dung_user_coupon
    ON voucher_nguoi_dung (ma_nguoi_dung, ma_phieu_giam_gia);
