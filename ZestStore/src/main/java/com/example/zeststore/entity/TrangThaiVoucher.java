package com.example.zeststore.entity;

public enum TrangThaiVoucher {
    CHUA_NHAN(0),
    DA_NHAN(1),
    DA_DUNG(2),
    DA_THU_HOI(3);

    private final int value;

    TrangThaiVoucher(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static TrangThaiVoucher fromValue(int value) {
        for (TrangThaiVoucher t : values()) {
            if (t.value == value) return t;
        }
        return DA_NHAN;
    }
}
