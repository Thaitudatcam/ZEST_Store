SET QUOTED_IDENTIFIER ON;
GO

-- Backfill loyalty points for orders completed before the loyalty v2 system was deployed.
-- Only backfill for orders with trang_thai_don IN (4,6) (completed/in transit),
-- having a user (ma_nguoi_dung IS NOT NULL), and that don't already have a lich_su_diem record.

-- Batch 1: Create diem_tich_luy wallets for users who have completed orders but no wallet yet
INSERT INTO diem_tich_luy (ma_nguoi_dung, so_diem_hien_tai, ngay_cap_nhat)
SELECT DISTINCT d.ma_nguoi_dung, 0, GETDATE()
FROM don_hang d
WHERE d.trang_thai_don IN (4, 6)
  AND d.ma_nguoi_dung IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM diem_tich_luy dtl WHERE dtl.ma_nguoi_dung = d.ma_nguoi_dung
  );

GO

-- Batch 2: Backfill lich_su_diem for each completed order
-- Points = FLOOR(tong_tien / 10000), 12-month expiry from ngay_cap_nhat
INSERT INTO lich_su_diem (
    ma_nguoi_dung,
    loai_giao_dich,
    so_diem,
    so_diem_con_lai,
    ma_don_hang,
    ma_kenh,
    ngay_tich,
    ngay_het_han,
    thoi_gian
)
SELECT
    d.ma_nguoi_dung,
    'TICH_LUY',
    FLOOR(d.tong_tien / 10000),
    FLOOR(d.tong_tien / 10000),
    d.ma_don_hang,
    CASE WHEN d.loai_don_hang = 2 THEN 'POS' ELSE 'ONLINE' END,
    COALESCE(d.ngay_cap_nhat, d.ngay_dat, GETDATE()),
    DATEADD(MONTH, 12, COALESCE(d.ngay_cap_nhat, d.ngay_dat, GETDATE())),
    GETDATE()
FROM don_hang d
WHERE d.trang_thai_don IN (4, 6)
  AND d.ma_nguoi_dung IS NOT NULL
  AND FLOOR(d.tong_tien / 10000) > 0
  AND NOT EXISTS (
      SELECT 1 FROM lich_su_diem ls
      WHERE ls.ma_don_hang = d.ma_don_hang AND ls.loai_giao_dich = 'TICH_LUY'
  );

GO

-- Batch 3: Update diem_tich_luy.so_diem_hien_tai to reflect backfilled points
UPDATE dtl
SET dtl.so_diem_hien_tai = COALESCE((
    SELECT SUM(ls.so_diem)
    FROM lich_su_diem ls
    WHERE ls.ma_nguoi_dung = dtl.ma_nguoi_dung AND ls.loai_giao_dich = 'TICH_LUY'
), 0),
dtl.ngay_cap_nhat = GETDATE()
FROM diem_tich_luy dtl
WHERE EXISTS (
    SELECT 1 FROM lich_su_diem ls
    WHERE ls.ma_nguoi_dung = dtl.ma_nguoi_dung
);

GO
