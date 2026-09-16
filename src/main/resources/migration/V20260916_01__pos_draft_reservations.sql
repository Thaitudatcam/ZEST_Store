-- Additive migration; legacy reservations expire normally, stock is not modified.
IF COL_LENGTH('dbo.pos_cart', 'draft_key') IS NULL
    ALTER TABLE dbo.pos_cart ADD draft_key VARCHAR(64) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_pos_cart_admin_draft' AND object_id = OBJECT_ID('dbo.pos_cart'))
    CREATE INDEX ix_pos_cart_admin_draft ON dbo.pos_cart(admin_id, draft_key);
GO
