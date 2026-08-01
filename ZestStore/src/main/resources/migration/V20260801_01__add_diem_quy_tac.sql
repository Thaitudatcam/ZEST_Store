-- Quy tắc sử dụng điểm tích lũy (cấu hình 1 dòng, chỉnh được từ admin)
IF OBJECT_ID('diem_quy_tac') IS NULL
BEGIN
    CREATE TABLE diem_quy_tac (
        ma_quy_tac INT IDENTITY(1,1) PRIMARY KEY,
        ti_le_tich INT NOT NULL DEFAULT 10000,
        ti_le_doi INT NOT NULL DEFAULT 1000,
        thoi_han_thang INT NOT NULL DEFAULT 12,
        diem_toi_thieu INT NOT NULL DEFAULT 10,
        giam_toi_da_phan_tram INT NOT NULL DEFAULT 50,
        tich_tien_mat BIT NOT NULL DEFAULT 1,
        ngay_cap_nhat DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM diem_quy_tac)
BEGIN
    INSERT INTO diem_quy_tac (ti_le_tich, ti_le_doi, thoi_han_thang, diem_toi_thieu, giam_toi_da_phan_tram, tich_tien_mat)
    VALUES (10000, 1000, 12, 10, 50, 1);
END
GO
