-- Batch 1: gỡ FK + cột trên PhieuGiamGia
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_phieu_giam_gia_dot')
    ALTER TABLE phieu_giam_gia DROP CONSTRAINT FK_phieu_giam_gia_dot;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FKr6ee3ss1afadfflq2t5od17ya')
    ALTER TABLE phieu_giam_gia DROP CONSTRAINT FKr6ee3ss1afadfflq2t5od17ya;
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF__phieu_gia__loai___7C6F7215')
    ALTER TABLE phieu_giam_gia DROP CONSTRAINT DF__phieu_gia__loai___7C6F7215;

IF COL_LENGTH('phieu_giam_gia', 'ma_dot') IS NOT NULL
    ALTER TABLE phieu_giam_gia DROP COLUMN ma_dot;

IF COL_LENGTH('phieu_giam_gia', 'loai_phat_hanh') IS NOT NULL
    ALTER TABLE phieu_giam_gia DROP COLUMN loai_phat_hanh;

GO

-- Batch 2: drop bảng theo đúng thứ tự phụ thuộc
IF OBJECT_ID('dot_phat_hanh', 'U') IS NOT NULL DROP TABLE dot_phat_hanh;
IF OBJECT_ID('lich_su_diem', 'U') IS NOT NULL DROP TABLE lich_su_diem;
IF OBJECT_ID('diem_tich_luy', 'U') IS NOT NULL DROP TABLE diem_tich_luy;
