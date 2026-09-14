package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.exception.BadRequestException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class OrderInventoryTest {
    @Mock DonHangRepository orders;
    @Mock MucDonHangRepository items;
    @Mock GioHangRepository carts;
    @Mock MucGioHangRepository cartItems;
    @Mock BienTheSanPhamRepository variants;
    @Mock PhieuGiamGiaRepository coupons;
    @Mock NguoiDungRepository users;
    @Mock ThanhToanRepository payments;
    @Mock LichSuDonHangRepository history;
    @Mock OrderSseService sse;
    @Mock ThongBaoService notifications;
    @Mock GhnService shipping;
    @Mock VoucherNguoiDungRepository vouchers;
    @Mock PhieuGiamGiaService couponService;

    @Mock InventoryService inventory;
    @Mock CampaignDiscountService campaignDiscount;
    @InjectMocks DonHangService service;
    DonHang order;
    NguoiDung user;
    @BeforeEach void setup() {
        user = NguoiDung.builder().maNguoiDung(7).build();
        order = DonHang.builder().maDonHang(1).nguoiDung(user).trangThaiDon(1).build();
        when(orders.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        when(orders.save(any())).thenAnswer(i -> { DonHang o=i.getArgument(0); o.setMaDonHang(1); return o; });
        when(users.findById(7)).thenReturn(Optional.of(user));
        when(payments.findByDonHang_MaDonHang(1)).thenReturn(List.of());
    }
    @Test void duplicateCodConfirmationDoesNotDeductTwice() {
        service.updateOrderStatus(1, 2, 7);
        service.updateOrderStatus(1, 2, 7);
        verify(inventory, times(1)).deduct(order);
    }
    @Test void cannotSkipConfirmationOrRepeatReturn() {
        assertThrows(BadRequestException.class, () -> service.updateOrderStatus(1, 6, 7));
        assertThrows(BadRequestException.class, () -> service.updateOrderStatus(1, 8, 7));
        verifyNoInteractions(inventory);
    }
    @Test void adminCancellationReleasesStockOnce() {
        order.setTrangThaiDon(2);
        service.updateOrderStatus(1, 5, 7);
        service.updateOrderStatus(1, 5, 7);
        verify(inventory, times(1)).release(order);
    }
    @Test void placeOrderReservesStockAndCreatesPayment() {
        GioHang cart=GioHang.builder().maGioHang(9).build();
        BienTheSanPham v=BienTheSanPham.builder().maBienThe(2).tonKho(10).gia(BigDecimal.TEN).build();
        when(carts.findByNguoiDung_MaNguoiDung(7)).thenReturn(Optional.of(cart));
        when(cartItems.findByGioHang_MaGioHang(9)).thenReturn(List.of(
                MucGioHang.builder().bienThe(v).soLuong(2).build()));
        when(payments.save(any())).thenAnswer(i -> i.getArgument(0));
        when(history.save(any())).thenAnswer(i -> i.getArgument(0));
        service.placeOrder(7, OrderRequest.builder().phuongThucThanhToan(2).build());
        verify(inventory, times(1)).reserve(any(DonHang.class));
    }
}
