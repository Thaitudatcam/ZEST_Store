-- ============================================================
-- Phase 1: Loyalty Points tables
-- ============================================================

CREATE TABLE diem_tich_luy (
    ma_nguoi_dung INT NOT NULL,
    so_diem INT NOT NULL DEFAULT 0,
    tong_tich_luy INT NOT NULL DEFAULT 0,
    tong_su_dung INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_diem_tich_luy PRIMARY KEY (ma_nguoi_dung),
    CONSTRAINT FK_diem_tich_luy_nguoi_dung FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung)
);

CREATE TABLE lich_su_diem (
    ma_giao_dich INT IDENTITY(1,1) NOT NULL,
    ma_nguoi_dung INT NOT NULL,
    loai_giao_dich TINYINT NOT NULL,
    so_diem INT NOT NULL,
    so_du_sau INT NOT NULL,
    ngay_het_han DATE NULL,
    ma_don_hang INT NULL,
    thoi_gian DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_lich_su_diem PRIMARY KEY (ma_giao_dich),
    CONSTRAINT FK_lich_su_diem_nguoi_dung FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung),
    CONSTRAINT FK_lich_su_diem_don_hang FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang)
);

CREATE INDEX IX_lich_su_diem_ma_nguoi_dung ON lich_su_diem(ma_nguoi_dung);
CREATE INDEX IX_lich_su_diem_ngay_het_han ON lich_su_diem(ngay_het_han) WHERE loai_giao_dich = 1;

-- ============================================================
-- Phase 2: Add so_tien_giam_diem to don_hang
-- ============================================================

ALTER TABLE don_hang ADD so_tien_giam_diem DECIMAL(18,2) NOT NULL DEFAULT 0;

-- ============================================================
-- Phase 3: Voucher cầm tay (batch voucher)
-- ============================================================

CREATE TABLE dot_phat_hanh (
    ma_dot INT IDENTITY(1,1) NOT NULL,
    ten_dot NVARCHAR(200) NOT NULL,
    kieu_giam_gia TINYINT NOT NULL,
    gia_tri_giam DECIMAL(18,2) NOT NULL,
    gia_tri_don_toi_thieu DECIMAL(18,2),
    gia_tri_giam_toi_da DECIMAL(18,2),
    so_luong INT NOT NULL,
    da_tao INT NOT NULL DEFAULT 0,
    ngay_bat_dau DATETIME2,
    ngay_ket_thuc DATETIME2,
    ngay_tao DATETIME2 NOT NULL DEFAULT GETDATE(),
    nguoi_tao INT NOT NULL,
    CONSTRAINT PK_dot_phat_hanh PRIMARY KEY (ma_dot),
    CONSTRAINT FK_dot_phat_hanh_nguoi_tao FOREIGN KEY (nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung)
);

ALTER TABLE phieu_giam_gia ADD loai_phat_hanh TINYINT NOT NULL DEFAULT 1;
ALTER TABLE phieu_giam_gia ADD ma_dot INT NULL;
ALTER TABLE phieu_giam_gia ADD CONSTRAINT FK_phieu_giam_gia_dot FOREIGN KEY (ma_dot) REFERENCES dot_phat_hanh(ma_dot);

-- ============================================================
-- Phase 4: Quick account creation at POS
-- ============================================================

ALTER TABLE nguoi_dung ADD nguon_tao VARCHAR(20) NOT NULL DEFAULT 'SELF_REGISTER';
