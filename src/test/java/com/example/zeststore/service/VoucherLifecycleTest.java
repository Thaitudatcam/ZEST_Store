package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.PhieuGiamGia;
import com.example.zeststore.entity.TrangThaiVoucher;
import com.example.zeststore.entity.VoucherNguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.CouponUsageLogRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.repository.VoucherNguoiDungRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VoucherLifecycleTest {

    @Mock VoucherNguoiDungRepository voucherRepository;
    @Mock NguoiDungRepository userRepository;
    @Mock PhieuGiamGiaRepository couponRepository;
    @Mock PhieuGiamGiaService couponService;
    @Mock CouponUsageLogRepository usageRepository;
    @InjectMocks VoucherNguoiDungService service;

    private PhieuGiamGia coupon(boolean publicCoupon) {
        return PhieuGiamGia.builder()
                .maPhieuGiamGia(1)
                .maCode("SALE")
                .congKhai(publicCoupon)
                .trangThai(1)
                .soLuong(1)
                .kieuGiamGia(2)
                .giaTriGiam(BigDecimal.TEN)
                .build();
    }

    @Test
    void publicClaimAllocatesOneUseWithoutTurningCouponOff() {
        PhieuGiamGia coupon = coupon(true);
        when(couponRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(coupon));
        when(userRepository.findById(7)).thenReturn(Optional.of(NguoiDung.builder().maNguoiDung(7).build()));

        service.claimVoucher(7, "SALE");

        assertEquals(0, coupon.getSoLuong());
        assertEquals(1, coupon.getTrangThai());
        ArgumentCaptor<VoucherNguoiDung> saved = ArgumentCaptor.forClass(VoucherNguoiDung.class);
        verify(voucherRepository).save(saved.capture());
        assertEquals(TrangThaiVoucher.DA_NHAN, saved.getValue().getTrangThai());
    }

    @Test
    void privateCouponCannotBeClaimedByGuessingItsCode() {
        PhieuGiamGia coupon = coupon(false);
        when(couponRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(coupon));

        assertThrows(BadRequestException.class, () -> service.claimVoucher(7, "SALE"));
    }

    @Test
    void expiredGiftCannotBeAcceptedBeforeNightlyCleanupRuns() {
        VoucherNguoiDung voucher = VoucherNguoiDung.builder()
                .maVoucherNguoiDung(3)
                .nguoiDung(NguoiDung.builder().maNguoiDung(7).build())
                .trangThai(TrangThaiVoucher.CHUA_NHAN)
                .ngayHetHan(LocalDateTime.now().minusMinutes(1))
                .build();
        when(voucherRepository.findById(3)).thenReturn(Optional.of(voucher));

        assertThrows(BadRequestException.class, () -> service.acceptVoucher(3, 7));
    }
}
