package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.exception.BadRequestException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class PosInventoryTest {
    @Mock BienTheSanPhamRepository variants;
    @Mock DonHangRepository orders;
    @Mock MucDonHangRepository items;
    @Mock ThanhToanRepository payments;
    @Mock LichSuDonHangRepository history;
    @Mock NguoiDungRepository users;
    @Mock PhieuGiamGiaRepository coupons;
    @Mock PosCartRepository carts;
    @Mock PhieuGiamGiaService couponService;
    @Mock VoucherNguoiDungRepository vouchers;
    @Mock DiemService points;
    @Mock InventoryService inventory;
    @InjectMocks POSService service;
    PosOrderRequest request;
    BienTheSanPham variant;
    PosCartItem hold;
    @BeforeEach void setup() {
        when(users.findByIdForUpdate(7)).thenReturn(Optional.of(NguoiDung.builder().maNguoiDung(7).build()));
        request=PosOrderRequest.builder().checkoutKey("unique-attempt").phuongThucThanhToan(5)
                .items(List.of(PosOrderRequest.PosItem.builder().maBienThe(2).soLuong(2).build())).build();
        variant=BienTheSanPham.builder().maBienThe(2).tonKho(10).gia(BigDecimal.TEN).build();
        hold=PosCartItem.builder().bienThe(variant).soLuong(2).ngayTao(LocalDateTime.now()).build();
        when(inventory.lockVariant(2)).thenReturn(variant);
        when(carts.findByAdmin_MaNguoiDungAndBienThe_MaBienThe(7,2)).thenReturn(Optional.of(hold));
        when(orders.save(any())).thenAnswer(i -> { DonHang o=i.getArgument(0); o.setMaDonHang(1); return o; });
    }
    @Test void replayReturnsOriginalOrderWithoutDeductingAgain() {
        var first=service.createPosOrder(request, 7);
        ArgumentCaptor<DonHang> saved=ArgumentCaptor.forClass(DonHang.class);
        verify(orders).save(saved.capture());
        when(orders.findByCheckoutKey("POS:7:unique-attempt")).thenReturn(Optional.of(saved.getValue()));
        var repeated=service.createPosOrder(request, 7);
        assertEquals(first.get("maDonHang"), repeated.get("maDonHang"));
        verify(inventory, times(1)).deductPos(any(), eq(7));
    }
    @Test void duplicateLinesCannotExceedReservedQuantity() {
        request.setItems(List.of(request.getItems().get(0), request.getItems().get(0)));
        assertThrows(BadRequestException.class, () -> service.createPosOrder(request,7));
        verify(inventory, never()).deductPos(any(), any());
    }
    @Test void expiredHoldMustBeReacquiredBeforeTakingPayment() {
        hold.setNgayTao(LocalDateTime.now().minusHours(1));
        assertThrows(BadRequestException.class, () -> service.createPosOrder(request,7));
        verify(orders, never()).save(any());
    }
    @Test void noUnpaidCompletedZaloPayPosOrders() {
        request.setPhuongThucThanhToan(4);
        assertThrows(BadRequestException.class, () -> service.createPosOrder(request,7));
        verifyNoInteractions(inventory);
    }
    @Test void zeroQuantityIsRejectedBeforeStockMutation() {
        request.getItems().get(0).setSoLuong(0);
        assertThrows(BadRequestException.class, () -> service.createPosOrder(request,7));
        verifyNoInteractions(inventory);
    }
}
