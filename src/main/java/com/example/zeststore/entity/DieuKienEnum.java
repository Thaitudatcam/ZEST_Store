package com.example.zeststore.entity;

public enum DieuKienEnum {
    DA_TUNG_MUA_HANG(0);

    private final int value;

    DieuKienEnum(int value) { this.value = value; }

    public int getValue() { return value; }

    public static DieuKienEnum fromValue(int value) {
        for (DieuKienEnum t : values()) if (t.value == value) return t;
        return DA_TUNG_MUA_HANG;
    }
}
