-- loai cột varchar(50) mang giá trị mô tả (không bị ràng buộc logic),
-- nhưng CHECK constraint cũ chỉ cho phép ('system','promotion','order') làm hỏng
-- các thông báo mới (DON_HANG_MOI, YEU_CAU_TRA_HANG,...). Bỏ constraint để loại
-- trừ khả năng tái diễn khi thêm loại thông báo mới.
IF OBJECT_ID('CK__thong_bao__loai__5E8A0973') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[thong_bao] DROP CONSTRAINT [CK__thong_bao__loai__5E8A0973];
END
GO