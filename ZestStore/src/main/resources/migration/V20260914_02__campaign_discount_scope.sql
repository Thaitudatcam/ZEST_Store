-- Chuong trinh giam gia theo dot: gia tri giam + scope san pham / bien the
ALTER TABLE chuong_trinh_qua_tang ADD kieu_giam_gia TINYINT NULL;
ALTER TABLE chuong_trinh_qua_tang ADD gia_tri_giam DECIMAL(18,2) NULL;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'campaign_san_pham')
CREATE TABLE campaign_san_pham (
    ma_chuong_trinh INT NOT NULL,
    ma_san_pham INT NOT NULL,
    CONSTRAINT PK_campaign_san_pham PRIMARY KEY (ma_chuong_trinh, ma_san_pham),
    CONSTRAINT FK_campaign_sp_chuong_trinh FOREIGN KEY (ma_chuong_trinh) REFERENCES chuong_trinh_qua_tang (ma_chuong_trinh) ON DELETE CASCADE,
    CONSTRAINT FK_campaign_sp_san_pham FOREIGN KEY (ma_san_pham) REFERENCES san_pham (ma_san_pham) ON DELETE CASCADE
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'campaign_bien_the')
CREATE TABLE campaign_bien_the (
    ma_chuong_trinh INT NOT NULL,
    ma_bien_the INT NOT NULL,
    CONSTRAINT PK_campaign_bien_the PRIMARY KEY (ma_chuong_trinh, ma_bien_the),
    CONSTRAINT FK_campaign_bt_chuong_trinh FOREIGN KEY (ma_chuong_trinh) REFERENCES chuong_trinh_qua_tang (ma_chuong_trinh) ON DELETE CASCADE,
    CONSTRAINT FK_campaign_bt_bien_the FOREIGN KEY (ma_bien_the) REFERENCES bien_the_san_pham (ma_bien_the) ON DELETE CASCADE
);
