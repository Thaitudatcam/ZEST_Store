package com.example.zeststore.service;

import com.example.zeststore.dto.response.PaymentListDTO;
import com.example.zeststore.dto.response.PaymentStatsDTO;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThanhToanService {

    private final ThanhToanRepository thanhToanRepository;
    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final MucGioHangRepository mucGioHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final GioHangRepository gioHangRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final OrderSseService orderSseService;
    private final InventoryService inventoryService;
    private final jakarta.persistence.EntityManager entityManager;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;

    public List<ThanhToan> getPaymentsByOrder(Integer orderId) {
        return thanhToanRepository.findByDonHang_MaDonHang(orderId);
    }

    public ThanhToan getPaymentById(Integer paymentId) {
        return thanhToanRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
    }

    public List<PaymentListDTO> getAllPayments(String keyword, Integer status, Integer method) {
        List<ThanhToan> payments = thanhToanRepository.findAll(
                Sort.by(Sort.Direction.DESC, "thoiGianTao"));
        Map<Integer, NguoiDung> userCache = new HashMap<>();
        Map<Integer, String> productCache = new HashMap<>();

        return payments.stream()
                .filter(p -> status == null || p.getTrangThaiThanhToan().equals(status))
                .filter(p -> method == null || p.getPhuongThuc().equals(method))
                .map(p -> toListDTO(p, userCache, productCache))
                .filter(dto -> matchesKeyword(dto, keyword))
                .collect(Collectors.toList());
    }

    public PaymentStatsDTO getPaymentStats() {
        LocalDateTime since30Days = LocalDateTime.now().minusDays(30);
        BigDecimal totalRevenue = thanhToanRepository.sumSoTienByTrangThai(2);
        BigDecimal lastPayout = thanhToanRepository.sumCompletedSince(since30Days);
        BigDecimal nextPayout = thanhToanRepository.sumSoTienByTrangThai(1);

        return PaymentStatsDTO.builder()
                .totalRevenue(totalRevenue)
                .recentPayments(thanhToanRepository.countCompletedSince(since30Days))
                .pendingPayments(thanhToanRepository.countByTrangThaiThanhToan(1))
                .failedPayments(thanhToanRepository.countByTrangThaiThanhToan(3))
                .lastPayout(lastPayout)
                .nextPayout(nextPayout)
                .totalPayoutAmount(totalRevenue)
                .build();
    }

    private PaymentListDTO toListDTO(ThanhToan p, Map<Integer, NguoiDung> userCache,
                                     Map<Integer, String> productCache) {
        NguoiDung user = p.getMaNguoiDung() != null
                ? userCache.computeIfAbsent(p.getMaNguoiDung(),
                        id -> nguoiDungRepository.findById(id).orElse(null))
                : null;
        DonHang order = p.getDonHang();
        String tenSanPham = null;
        if (order != null) {
            tenSanPham = productCache.computeIfAbsent(order.getMaDonHang(), id -> {
                List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(id);
                return (items.isEmpty() || items.get(0).getBienThe() == null
                        || items.get(0).getBienThe().getSanPham() == null)
                        ? null : items.get(0).getBienThe().getSanPham().getTenSanPham();
            });
        }
        return PaymentListDTO.builder()
                .maThanhToan(p.getMaThanhToan())
                .maGiaoDich(p.getMaGiaoDich())
                .tenNguoiDung(user != null ? user.getHoTen() : null)
                .emailNguoiDung(user != null ? user.getEmail() : null)
                .maDonHang(order != null ? order.getMaDonHang() : null)
                .maDonHangCode(order != null ? order.getMaDonHangCode() : null)
                .tenSanPham(tenSanPham)
                .phuongThuc(p.getPhuongThuc())
                .thoiGianTao(p.getThoiGianTao())
                .thoiGianTt(p.getThoiGianTt())
                .soTien(p.getSoTien())
                .trangThaiThanhToan(p.getTrangThaiThanhToan())
                .build();
    }

    private boolean matchesKeyword(PaymentListDTO dto, String keyword) {
        if (keyword == null || keyword.isBlank()) return true;
        String k = keyword.toLowerCase();
        return String.valueOf(dto.getMaThanhToan()).contains(k)
                || (dto.getMaGiaoDich() != null && dto.getMaGiaoDich().toLowerCase().contains(k))
                || (dto.getMaDonHangCode() != null && dto.getMaDonHangCode().toLowerCase().contains(k))
                || (dto.getTenNguoiDung() != null && dto.getTenNguoiDung().toLowerCase().contains(k))
                || (dto.getEmailNguoiDung() != null && dto.getEmailNguoiDung().toLowerCase().contains(k));
    }

    private ThanhToan lockPayment(Integer id) {
        ThanhToan snapshot = getPaymentById(id);
        if (snapshot.getDonHang() != null) {
            DonHang order = donHangRepository.findByIdForUpdate(snapshot.getDonHang().getMaDonHang())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", snapshot.getDonHang().getMaDonHang()));
            entityManager.refresh(order);
        }
        ThanhToan payment = thanhToanRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
        entityManager.refresh(payment);
        return payment;
    }

    @Transactional
    public ThanhToan completePayment(Integer paymentId, String maGiaoDich) {
        ThanhToan payment = lockPayment(paymentId);
        if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) return payment;
        if (payment.getDonHang() != null && "LEGACY".equals(payment.getDonHang().getStockState()))
            throw new BadRequestException("Thanh toán đơn cũ cần đối soát kho và hoàn tiền trước khi xử lý");
        // Keep maGiaoDich as the stable merchant reference for repeated gateway callbacks.
        payment.setGatewayTransactionId(maGiaoDich);
        payment.setThoiGianTt(LocalDateTime.now());
        DonHang order = payment.getDonHang();
        if (order == null) {
            payment.setTrangThaiThanhToan(2);
        } else if (java.util.Set.of(5, 9).contains(order.getTrangThaiDon())) {
            // A provider can settle after the local reservation has expired. Do not ship twice.
            if (order.getNguoiDung() == null)
                throw new BadRequestException("Thanh toán đến muộn cần đối soát thủ công cho khách lẻ");
            payment.setTrangThaiThanhToan(3);
        } else {
            inventoryService.deduct(order);
            payment.setTrangThaiThanhToan(2);
            if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
                order.setTrangThaiDon(2);
                donHangRepository.save(order);
                orderSseService.sendOrderStatusUpdate(order.getMaDonHang(), 2, 1, "payment", null);
            }
            clearCartForOrder(order);
        }
        return thanhToanRepository.save(payment);
    }

    private void clearCartForOrder(DonHang order) {
        List<MucDonHang> orderItems = mucDonHangRepository.findByDonHang_MaDonHang(order.getMaDonHang());
        if (order.getNguoiDung() == null) return;
        gioHangRepository.findByNguoiDung_MaNguoiDung(order.getNguoiDung().getMaNguoiDung())
                .ifPresent(cart -> {
                    for (MucDonHang orderItem : orderItems) {
                        mucGioHangRepository.findByGioHang_MaGioHangAndBienThe_MaBienThe(
                                cart.getMaGioHang(), orderItem.getBienThe().getMaBienThe())
                            .ifPresent(mucGioHangRepository::delete);
                    }
                });
    }

    private ThanhToan failLocked(ThanhToan payment) {
        // Failure notifications must never overwrite a successful settlement.
        if (!Integer.valueOf(1).equals(payment.getTrangThaiThanhToan())) return payment;
        DonHang order = payment.getDonHang();
        if (order != null && Integer.valueOf(1).equals(order.getTrangThaiDon())) {
            inventoryService.release(order);
            order.setTrangThaiDon(5);
            donHangRepository.save(order);
        }
        payment.setTrangThaiThanhToan(3);
        return thanhToanRepository.save(payment);
    }

    @Transactional
    public ThanhToan failPayment(Integer paymentId) {
        return failLocked(lockPayment(paymentId));
    }

    @Scheduled(fixedRate = 300000)
    public void autoCancelExpiredPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(2);
        List<Integer> expiredIds = thanhToanRepository.findByTrangThaiThanhToanAndThoiGianTaoBefore(1, threshold)
                .stream().filter(p -> !Integer.valueOf(1).equals(p.getPhuongThuc()))
                .map(ThanhToan::getMaThanhToan).toList();
        var tx = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        for (Integer id : expiredIds) {
            try {
                tx.executeWithoutResult(ignored -> {
                    ThanhToan payment = lockPayment(id);
                    if (Integer.valueOf(1).equals(payment.getTrangThaiThanhToan())
                            && !Integer.valueOf(1).equals(payment.getPhuongThuc())
                            && payment.getThoiGianTao().isBefore(threshold)) failLocked(payment);
                });
            } catch (RuntimeException ex) {
                log.error("Không thể xử lý thanh toán hết hạn #{}; cần đối soát", id, ex);
            }
        }
    }

    @Transactional
    public ThanhToan retryPayment(Integer paymentId, Integer userId) {
        ThanhToan payment = lockPayment(paymentId);
        DonHang order = payment.getDonHang();
        if (order == null || order.getNguoiDung() == null
                || !order.getNguoiDung().getMaNguoiDung().equals(userId))
            throw new BadRequestException("Payment does not belong to current user");
        if (!Integer.valueOf(1).equals(order.getTrangThaiDon())
                || !Integer.valueOf(1).equals(payment.getTrangThaiThanhToan()))
            throw new BadRequestException("Đơn đã hủy/đã xử lý. Vui lòng tạo đơn mới");
        // Preserve the original deadline and reference; retries do not extend stock holds.
        return payment;
    }
}
