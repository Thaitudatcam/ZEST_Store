package com.example.zeststore.entity;

public enum DoiTuongEnum {
    TAT_CA(0);

    private final int value;

    DoiTuongEnum(int value) { this.value = value; }

    public int getValue() { return value; }

    public static DoiTuongEnum fromValue(int value) {
        for (DoiTuongEnum t : values()) if (t.value == value) return t;
        return TAT_CA;
    }
}
