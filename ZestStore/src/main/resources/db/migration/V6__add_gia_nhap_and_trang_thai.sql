IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bien_the_san_pham') AND name = 'gia_nhap')
    ALTER TABLE bien_the_san_pham ADD gia_nhap DECIMAL(18,2) DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bien_the_san_pham') AND name = 'trang_thai')
    ALTER TABLE bien_the_san_pham ADD trang_thai INT DEFAULT 1;

UPDATE bien_the_san_pham SET gia_nhap = 0 WHERE gia_nhap IS NULL;
UPDATE bien_the_san_pham SET trang_thai = 1 WHERE trang_thai IS NULL;
