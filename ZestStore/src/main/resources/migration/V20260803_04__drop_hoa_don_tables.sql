-- Xóa bảng hóa đơn cũ (đã tích hợp in hóa đơn vào don_hang qua cột so_lan_in).
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.chi_tiet_hoa_don', N'U') IS NOT NULL
BEGIN
    DECLARE @fkName NVARCHAR(128);
    SELECT @fkName = fk.name
    FROM sys.foreign_keys fk
    WHERE fk.parent_object_id = OBJECT_ID(N'dbo.chi_tiet_hoa_don')
      AND fk.referenced_object_id = OBJECT_ID(N'dbo.hoa_don');

    IF @fkName IS NOT NULL
        EXEC(N'ALTER TABLE dbo.chi_tiet_hoa_don DROP CONSTRAINT [' + @fkName + N']');
END

IF OBJECT_ID(N'dbo.chi_tiet_hoa_don', N'U') IS NOT NULL
    DROP TABLE dbo.chi_tiet_hoa_don;

IF OBJECT_ID(N'dbo.hoa_don', N'U') IS NOT NULL
    DROP TABLE dbo.hoa_don;
