package com.example.zeststore.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DonHangTest {

    @Test
    void prePersistAssignsUniqueTemporaryOrderCode() {
        DonHang first = new DonHang();
        DonHang second = new DonHang();

        first.onCreate();
        second.onCreate();

        assertTrue(first.getMaDonHangCode().startsWith("TMP-"));
        assertEquals(20, first.getMaDonHangCode().length());
        assertNotEquals(first.getMaDonHangCode(), second.getMaDonHangCode());
    }

    @Test
    void prePersistKeepsExplicitOrderCode() {
        DonHang order = new DonHang();
        order.setMaDonHangCode("DH0123");

        order.onCreate();

        assertEquals("DH0123", order.getMaDonHangCode());
    }
}
