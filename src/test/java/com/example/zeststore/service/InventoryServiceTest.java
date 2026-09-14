package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.exception.BadRequestException;
import jakarta.persistence.*;
import org.junit.jupiter.api.*;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InventoryServiceTest {
    BienTheSanPhamRepository variants = mock(BienTheSanPhamRepository.class);
    MucDonHangRepository items = mock(MucDonHangRepository.class);
    DonHangRepository orders = mock(DonHangRepository.class);
    PosCartRepository carts = mock(PosCartRepository.class);
    EntityManager em = mock(EntityManager.class);
    InventoryService service = new InventoryService(variants, items, orders, carts, em);
    DonHang order = DonHang.builder().maDonHang(1).build();
    BienTheSanPham variant = BienTheSanPham.builder().maBienThe(2).sku("TEST").tonKho(10).build();
    @BeforeEach @SuppressWarnings("unchecked") void setup() {
        when(variants.findByIdForUpdate(2)).thenReturn(Optional.of(variant));
        when(items.findByDonHang_MaDonHang(1)).thenReturn(List.of(
                MucDonHang.builder().bienThe(variant).soLuong(2).build()));
        TypedQuery<Long> query = mock(TypedQuery.class);
        when(em.createQuery(anyString(), eq(Long.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(0L);
        when(carts.findByBienThe_MaBienThe(2)).thenReturn(List.of());
    }
    @Test void reserveThenDeductThenReturnExactlyOnce() {
        service.reserve(order);
        assertEquals(10, variant.getTonKho());
        assertEquals("RESERVED", order.getStockState());
        service.deduct(order); service.deduct(order);
        assertEquals(8, variant.getTonKho());
        service.release(order); service.release(order);
        assertEquals(10, variant.getTonKho());
        assertThrows(BadRequestException.class, () -> service.deduct(order));
    }
    @Test void cancelPendingReservationDoesNotIncreasePhysicalStock() {
        service.reserve(order); service.release(order);
        assertEquals(10, variant.getTonKho());
    }
    @Test void onlineCannotConsumePosHold() {
        when(carts.findByBienThe_MaBienThe(2)).thenReturn(List.of(PosCartItem.builder()
                .admin(NguoiDung.builder().maNguoiDung(7).build()).bienThe(variant)
                .soLuong(9).ngayTao(LocalDateTime.now()).build()));
        assertThrows(BadRequestException.class, () -> service.reserve(order));
        assertEquals(10, variant.getTonKho());
    }
    @Test void posConsumesItsOwnHold() {
        when(carts.findByBienThe_MaBienThe(2)).thenReturn(List.of(PosCartItem.builder()
                .admin(NguoiDung.builder().maNguoiDung(7).build()).bienThe(variant)
                .soLuong(10).ngayTao(LocalDateTime.now()).build()));
        service.deductPos(order, 7);
        assertEquals(8, variant.getTonKho());
    }
    @Test void repeatedVariantLinesAreSummedBeforeChecking() {
        when(items.findByDonHang_MaDonHang(1)).thenReturn(List.of(
                MucDonHang.builder().bienThe(variant).soLuong(6).build(),
                MucDonHang.builder().bienThe(variant).soLuong(6).build()));
        assertThrows(BadRequestException.class, () -> service.deduct(order));
        assertEquals(10, variant.getTonKho());
    }
    @Test void legacyStockIsNeverGuessed() {
        order.setStockState("LEGACY");
        assertThrows(BadRequestException.class, () -> service.release(order));
        assertEquals(10, variant.getTonKho());
    }
    @Test void expiredPosHoldsDoNotBlockNewOrders() {
        when(carts.findByBienThe_MaBienThe(2)).thenReturn(List.of(PosCartItem.builder()
                .soLuong(10).ngayTao(LocalDateTime.now().minusHours(1)).build()));
        service.reserve(order);
        assertEquals("RESERVED", order.getStockState());
    }
}
