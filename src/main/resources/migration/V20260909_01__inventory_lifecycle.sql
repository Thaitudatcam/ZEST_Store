-- SQL Server. Run once, with the application stopped, before deploying this version.
-- Never infer old stock movements from payment/status: the old code could miss or repeat them.
IF COL_LENGTH('don_hang', 'stock_state') IS NULL
    ALTER TABLE don_hang ADD stock_state VARCHAR(16) NOT NULL
        CONSTRAINT DF_don_hang_stock_state DEFAULT 'LEGACY' WITH VALUES;
IF COL_LENGTH('don_hang', 'checkout_key') IS NULL
    ALTER TABLE don_hang ADD checkout_key VARCHAR(100) NULL;
IF COL_LENGTH('thanh_toan', 'gateway_transaction_id') IS NULL
    ALTER TABLE thanh_toan ADD gateway_transaction_id VARCHAR(100) NULL;
IF COL_LENGTH('thanh_toan', 'refunded') IS NULL
    ALTER TABLE thanh_toan ADD refunded BIT NOT NULL
        CONSTRAINT DF_thanh_toan_refunded DEFAULT 0 WITH VALUES;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_don_hang_checkout_key')
    CREATE UNIQUE INDEX UX_don_hang_checkout_key ON don_hang(checkout_key) WHERE checkout_key IS NOT NULL;
GO
-- Reconcile LEGACY orders and count physical stock before accepting mutations on old orders.
-- Set DEDUCTED only with evidence stock was deducted and not restored;
-- NONE only if never deducted/reserved; RELEASED only if already released/restored.
-- Do not bulk assign these values using trang_thai_don or payment status.
SELECT ma_don_hang, trang_thai_don, stock_state FROM don_hang WHERE stock_state = 'LEGACY';
