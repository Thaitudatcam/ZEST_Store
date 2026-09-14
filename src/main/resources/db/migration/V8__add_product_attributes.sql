IF OBJECT_ID('dbo.thuoc_tinh', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.thuoc_tinh (
        ma_thuoc_tinh INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        loai_thuoc_tinh NVARCHAR(50) NOT NULL,
        gia_tri NVARCHAR(200) NOT NULL,
        ngay_tao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_loai_ao')
    ALTER TABLE dbo.san_pham ADD ma_loai_ao INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_kieu_dang')
    ALTER TABLE dbo.san_pham ADD ma_kieu_dang INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_chat_lieu')
    ALTER TABLE dbo.san_pham ADD ma_chat_lieu INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_co_ao')
    ALTER TABLE dbo.san_pham ADD ma_co_ao INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_tay_ao')
    ALTER TABLE dbo.san_pham ADD ma_tay_ao INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.san_pham') AND name = 'ma_vai_ao')
    ALTER TABLE dbo.san_pham ADD ma_vai_ao INT NULL;
