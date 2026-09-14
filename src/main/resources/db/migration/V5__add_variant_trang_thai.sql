ALTER TABLE bien_the_san_pham ADD trang_thai INT DEFAULT 1;
UPDATE bien_the_san_pham SET trang_thai = 1 WHERE trang_thai IS NULL;
