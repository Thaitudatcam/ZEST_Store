-- Bảng tổng hợp thống kê theo ngày (dashboard đọc nhanh thay vì tính live)
IF OBJECT_ID('thong_ke_ngay') IS NULL
BEGIN
    CREATE TABLE thong_ke_ngay (
        ngay              DATE          NOT NULL PRIMARY KEY,
        doanh_thu         DECIMAL(18,2) NOT NULL DEFAULT 0,
        so_don_moi        INT           NOT NULL DEFAULT 0,
        so_don_cho_xu_ly  INT           NOT NULL DEFAULT 0,
        so_don_dang_giao  INT           NOT NULL DEFAULT 0,
        so_don_cho_giao   INT           NOT NULL DEFAULT 0,
        so_don_da_giao    INT           NOT NULL DEFAULT 0,
        so_don_huy        INT           NOT NULL DEFAULT 0,
        so_nguoi_dung_moi INT           NOT NULL DEFAULT 0,
        so_san_pham_moi   INT           NOT NULL DEFAULT 0,
        ngay_cap_nhat     DATETIME2(7)  NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- Bảng báo cáo cũ không còn sử dụng (không có mapping Java)
IF OBJECT_ID('bao_cao_thong_ke') IS NOT NULL
BEGIN
    DROP TABLE bao_cao_thong_ke;
END
GO
