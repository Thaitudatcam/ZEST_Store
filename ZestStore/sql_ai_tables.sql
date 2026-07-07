CREATE TABLE hoi_thoai_ai (
    ma_hoi_thoai INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NULL,
    tieu_de NVARCHAR(255) NULL,
    ngay_tao DATETIME2 NOT NULL DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME2 NULL
);

CREATE TABLE tin_nhan_ai (
    ma_tin_nhan INT IDENTITY(1,1) PRIMARY KEY,
    ma_hoi_thoai INT NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    nguoi_gui VARCHAR(10) NOT NULL,
    ngay_tao DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_tin_nhan_ai_hoi_thoai FOREIGN KEY (ma_hoi_thoai) REFERENCES hoi_thoai_ai(ma_hoi_thoai)
);
