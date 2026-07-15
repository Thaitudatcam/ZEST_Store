package com.example.zeststore.entity;

public enum LoaiTrigger {
    DANG_KY_MOI(0),
    QUAY_LAI(1),
    SU_KIEN(2);

    private final int value;

    LoaiTrigger(int value) { this.value = value; }

    public int getValue() { return value; }

    public static LoaiTrigger fromValue(int value) {
        for (LoaiTrigger t : values()) if (t.value == value) return t;
        return DANG_KY_MOI;
    }
}
