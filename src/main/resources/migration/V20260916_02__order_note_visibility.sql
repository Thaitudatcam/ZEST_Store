IF COL_LENGTH('dbo.lich_su_don_hang', 'khach_hang_xem') IS NULL
    ALTER TABLE dbo.lich_su_don_hang ADD khach_hang_xem BIT NULL;
GO
