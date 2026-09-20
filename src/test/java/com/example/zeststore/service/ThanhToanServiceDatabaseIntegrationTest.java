package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.LichSuDonHang;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.entity.VaiTro;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.LichSuDonHangRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.ThanhToanRepository;
import com.example.zeststore.repository.VaiTroRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.ArgumentMatchers.any;

/**
 * Runs against the configured SQL Server, not an in-memory replacement.
 * Enable explicitly with ZEST_RUN_DB_INTEGRATION=true after configuring the
 * local datasource. The transaction is rolled back after each test.
 */
@Tag("integration")
@SpringBootTest
@ActiveProfiles("local")
@EnabledIfEnvironmentVariable(named = "ZEST_RUN_DB_INTEGRATION", matches = "true")
class ThanhToanServiceDatabaseIntegrationTest {

    @Autowired ThanhToanService thanhToanService;
    @Autowired DonHangRepository donHangRepository;
    @Autowired ThanhToanRepository thanhToanRepository;
    @Autowired NguoiDungRepository nguoiDungRepository;
    @Autowired VaiTroRepository vaiTroRepository;
    @Autowired LichSuDonHangRepository lichSuDonHangRepository;

    @MockitoBean InventoryService inventoryService;
    @MockitoBean PhieuGiamGiaService phieuGiamGiaService;

    @Test
    @Transactional
    void failedPaymentPersistsARealActorForHistoryForeignKey() {
        VaiTro adminRole = vaiTroRepository.findByTenVaiTro("ADMIN")
                .orElseGet(() -> vaiTroRepository.saveAndFlush(
                        VaiTro.builder().tenVaiTro("ADMIN").build()));
        NguoiDung actor = nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(
                        List.of("ADMIN", "STAFF"), 1)
                .stream().findFirst()
                .orElseGet(() -> nguoiDungRepository.saveAndFlush(NguoiDung.builder()
                        .vaiTro(adminRole)
                        .hoTen("Integration Admin")
                        .email("integration-admin@example.test")
                        .matKhauMaHoa("not-a-real-password")
                        .trangThai(1)
                        .build()));

        DonHang order = donHangRepository.saveAndFlush(DonHang.builder()
                .trangThaiDon(1)
                .stockState("NONE")
                .tongTien(BigDecimal.valueOf(100000))
                .tenNguoiNhan("Integration Buyer")
                .sdtNguoiNhan("0900000000")
                .diaChiGiaoHang("Integration address")
                .build());
        ThanhToan payment = thanhToanRepository.saveAndFlush(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(2)
                .trangThaiThanhToan(1)
                .soTien(BigDecimal.valueOf(100000))
                .build());

        doNothing().when(inventoryService).release(any(DonHang.class));
        thanhToanService.failPayment(payment.getMaThanhToan());

        List<LichSuDonHang> history = lichSuDonHangRepository
                .findByDonHang_MaDonHangOrderByThoiGianDesc(order.getMaDonHang());
        LichSuDonHang failure = history.stream()
                .filter(h -> Integer.valueOf(5).equals(h.getTrangThaiMoi()))
                .findFirst()
                .orElseThrow();

        assertNotNull(failure.getNguoiCapNhat(), "nguoi_cap_nhat must satisfy the FK");
        assertEquals(actor.getMaNguoiDung(), failure.getNguoiCapNhat().getMaNguoiDung());
    }
}
