-- Nullable columns: do not invent historical product values for existing orders.
IF COL_LENGTH('muc_don_hang', 'ten_san_pham_snapshot') IS NULL
    ALTER TABLE muc_don_hang ADD ten_san_pham_snapshot NVARCHAR(500) NULL;
IF COL_LENGTH('muc_don_hang', 'ma_san_pham_snapshot') IS NULL
    ALTER TABLE muc_don_hang ADD ma_san_pham_snapshot NVARCHAR(100) NULL;
IF COL_LENGTH('muc_don_hang', 'sku_snapshot') IS NULL
    ALTER TABLE muc_don_hang ADD sku_snapshot NVARCHAR(255) NULL;
IF COL_LENGTH('muc_don_hang', 'bien_the_snapshot') IS NULL
    ALTER TABLE muc_don_hang ADD bien_the_snapshot NVARCHAR(500) NULL;
