IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.san_pham')
      AND name = 'xuat_xu'
)
    ALTER TABLE dbo.san_pham ADD xuat_xu NVARCHAR(100) NULL;
