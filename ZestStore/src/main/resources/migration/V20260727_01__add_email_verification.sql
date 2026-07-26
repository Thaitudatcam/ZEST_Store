-- Add email verification and forgot-password columns to nguoi_dung

IF COL_LENGTH('nguoi_dung', 'email_da_xac_thuc') IS NULL
    ALTER TABLE nguoi_dung ADD email_da_xac_thuc BIT DEFAULT 0;

IF COL_LENGTH('nguoi_dung', 'email_moi_cho_xac_thuc') IS NULL
    ALTER TABLE nguoi_dung ADD email_moi_cho_xac_thuc VARCHAR(150) NULL;

IF COL_LENGTH('nguoi_dung', 'ma_xac_thuc_hash') IS NULL
    ALTER TABLE nguoi_dung ADD ma_xac_thuc_hash VARCHAR(64) NULL;

IF COL_LENGTH('nguoi_dung', 'ma_xac_thuc_het_han') IS NULL
    ALTER TABLE nguoi_dung ADD ma_xac_thuc_het_han DATETIME NULL;

IF COL_LENGTH('nguoi_dung', 'lan_gui_cuoi') IS NULL
    ALTER TABLE nguoi_dung ADD lan_gui_cuoi DATETIME NULL;

IF COL_LENGTH('nguoi_dung', 'so_lan_thu_sai') IS NULL
    ALTER TABLE nguoi_dung ADD so_lan_thu_sai INT DEFAULT 0;
