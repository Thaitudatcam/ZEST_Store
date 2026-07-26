-- Batch 1
CREATE TABLE diem_tich_luy (
    ma_nguoi_dung INT PRIMARY KEY REFERENCES nguoi_dung(ma_nguoi_dung),
    so_diem_hien_tai INT NOT NULL DEFAULT 0,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE lich_su_diem (
    ma_lich_su INT IDENTITY PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
    loai_giao_dich NVARCHAR(20) NOT NULL,
    so_diem INT NOT NULL,
    so_diem_con_lai INT NULL,
    ma_lich_su_goc INT NULL REFERENCES lich_su_diem(ma_lich_su),
    ma_don_hang INT NULL REFERENCES don_hang(ma_don_hang),
    ma_kenh NVARCHAR(10) NULL,
    ngay_tich DATETIME NULL,
    ngay_het_han DATETIME NULL,
    thoi_gian DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_lichsudiem_hethan ON lich_su_diem(ngay_het_han)
    WHERE loai_giao_dich = 'TICH_LUY' AND so_diem_con_lai > 0;

GO

-- Batch 2
IF COL_LENGTH('don_hang', 'so_tien_giam_diem') IS NULL
    ALTER TABLE don_hang ADD so_tien_giam_diem DECIMAL(18,2) NOT NULL DEFAULT 0;

GO

-- Batch 3
IF COL_LENGTH('nguoi_dung', 'nguon_tao') IS NULL
    ALTER TABLE nguoi_dung ADD nguon_tao NVARCHAR(20) NOT NULL DEFAULT 'SELF_REGISTER';
