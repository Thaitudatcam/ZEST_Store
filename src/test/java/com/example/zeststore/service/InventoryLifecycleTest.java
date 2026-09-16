package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import jakarta.persistence.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryLifecycleTest {
    @Mock BienTheSanPhamRepository variants;
    @Mock MucDonHangRepository items;
    @Mock DonHangRepository orders;
    @Mock PosCartRepository carts;
    @Mock EntityManager em;
    @Mock TypedQuery<Long> query;
    @InjectMocks InventoryService inventory;
    BienTheSanPham variant;
    DonHang order;
    @BeforeEach void setup() {
        variant = BienTheSanPham.builder().maBienThe(3).tonKho(10).sku("SP-S").build();
        order = DonHang.builder().maDonHang(1).stockState("NONE").build();
        lenient().when(variants.findByIdForUpdate(3)).thenReturn(Optional.of(variant));
        lenient().when(items.findByDonHang_MaDonHang(1)).thenReturn(List.of(MucDonHang.builder().bienThe(variant).soLuong(2).build()));
        lenient().when(em.createQuery(anyString(), eq(Long.class))).thenReturn(query);
        lenient().when(query.setParameter(anyString(), any())).thenReturn(query);
        lenient().when(query.getSingleResult()).thenReturn(0L);
    }
    PosCartItem hold(int adminId, String draft, int qty) {
        return PosCartItem.builder().admin(NguoiDung.builder().maNguoiDung(adminId).build())
                .bienThe(variant).draftKey(draft).soLuong(qty).ngayTao(LocalDateTime.now()).build();
    }
    @Test void onlineReservesOnPlacementAndDeductsOnceOnConfirmation() {
        inventory.reserve(order);
        assertEquals(10, variant.getTonKho());
        assertEquals("RESERVED", order.getStockState());
        inventory.deduct(order);
        inventory.deduct(order);
        assertEquals(8, variant.getTonKho());
        assertEquals("DEDUCTED", order.getStockState());
        verify(variants, times(1)).save(variant);
    }
    @Test void posSettlementExcludesOnlyItsOwnHoldAndDeductsOnce() {
        when(carts.findByBienThe_MaBienThe(3)).thenReturn(List.of(hold(5, "A", 2), hold(5, "B", 3), hold(6, "C", 1)));
        assertEquals(4, inventory.reserved(3, null, 5, "A"));
        inventory.deductPos(order, 5, "A");
        inventory.deductPos(order, 5, "A");
        assertEquals(8, variant.getTonKho());
        verify(variants, times(1)).save(variant);
    }
    @Test void onlineCannotReserveStockHeldByPos() {
        when(carts.findByBienThe_MaBienThe(3)).thenReturn(List.of(hold(5, "A", 9)));
        assertThrows(BadRequestException.class, () -> inventory.reserve(order));
        assertEquals(10, variant.getTonKho());
    }
    @Test void cancellationBeforeConfirmationDoesNotIncreasePhysicalStock() {
        inventory.reserve(order);
        inventory.release(order);
        inventory.release(order);
        assertEquals(10, variant.getTonKho());
        assertEquals("RELEASED", order.getStockState());
        verify(variants, never()).save(any());
    }
    @Test void cancellationAfterConfirmationRestoresOnlyOnce() {
        inventory.deduct(order);
        inventory.release(order);
        inventory.release(order);
        assertEquals(10, variant.getTonKho());
    }
    @Test void expiredPosHoldsDoNotReduceAvailability() {
        var expired = hold(5, "A", 9);
        expired.setNgayTao(LocalDateTime.now().minusMinutes(31));
        when(carts.findByBienThe_MaBienThe(3)).thenReturn(List.of(expired));
        assertEquals(0, inventory.reserved(3, null, null));
    }
}
