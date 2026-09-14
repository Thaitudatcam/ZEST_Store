-- Lưu danh sách sản phẩm khớp (dạng JSON) kèm tin nhắn AI để khi load lại hội thoại vẫn hiển thị link sản phẩm bấm được.
-- Chạy an toàn: chỉ thêm cột nếu chưa tồn tại.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.tin_nhan_ai') AND name = N'san_pham'
)
BEGIN
    ALTER TABLE dbo.tin_nhan_ai ADD san_pham NVARCHAR(MAX) NULL;
END