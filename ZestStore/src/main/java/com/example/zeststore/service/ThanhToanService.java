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

    private final ViService viService;

    @Transactional
    public ThanhToan completePayment(Integer paymentId, String maGiaoDich) {
        ThanhToan payment = thanhToanRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) {
            return payment;
        }

        payment.setMaGiaoDich(maGiaoDich);
        payment.setTrangThaiThanhToan(2);
        payment.setThoiGianTt(java.time.LocalDateTime.now());

        if (payment.getDonHang() == null) {
            thanhToanRepository.save(payment);
            String gateway = payment.getNhaCungCap() != null ? payment.getNhaCungCap() : "Ví ZestStore";
            viService.napTien(payment.getMaNguoiDung(), payment.getSoTien(),
                    "Nạp tiền qua " + gateway, payment.getMaThanhToan());
        } else {
            DonHang order = payment.getDonHang();
            if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
                order.setTrangThaiDon(2);
                donHangRepository.save(order);
                orderSseService.sendOrderStatusUpdate(order.getMaDonHang(), 2, 1, "payment", null);

                boolean isCOD = Integer.valueOf(1).equals(payment.getPhuongThuc());
                if (!isCOD) {
                    deductStock(order.getMaDonHang());
                }
            }

            thanhToanRepository.save(payment);

            clearCartForOrder(order);
        }

        return payment;
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

    @Transactional
    public ThanhToan failPayment(Integer paymentId) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setTrangThaiThanhToan(3);
        DonHang order = payment.getDonHang();
        if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
            order.setTrangThaiDon(5);
            donHangRepository.save(order);
        }
        return thanhToanRepository.save(payment);
    }

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void autoCancelExpiredPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(2);
        List<ThanhToan> expired = thanhToanRepository
                .findByTrangThaiThanhToanAndThoiGianTaoBefore(1, threshold);
        for (ThanhToan payment : expired) {
            DonHang order = payment.getDonHang();
            List<ThanhToan> orderPayments = thanhToanRepository
                    .findByDonHang_MaDonHang(order.getMaDonHang());
            boolean hasSuccessfulPayment = orderPayments.stream()
                    .anyMatch(p -> Integer.valueOf(2).equals(p.getTrangThaiThanhToan()));
            if (hasSuccessfulPayment) {
                log.warn("Order #{} already has a successful payment, skipping cancel", order.getMaDonHang());
                payment.setTrangThaiThanhToan(3);
                thanhToanRepository.save(payment);
                continue;
            }
            if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
                order.setTrangThaiDon(5);
                donHangRepository.save(order);
                log.info("Auto-cancelled expired order #{}", order.getMaDonHang());
            }
            payment.setTrangThaiThanhToan(3);
            thanhToanRepository.save(payment);
        }
    }

    private void deductStock(Integer orderId) {
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = bienTheRepository.findByIdForUpdate(item.getBienThe().getMaBienThe())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", item.getBienThe().getMaBienThe()));
            if (variant.getTonKho() < item.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku()
                        + " (available: " + variant.getTonKho() + ", needed: " + item.getSoLuong() + ")");
            }
            variant.setTonKho(variant.getTonKho() - item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }

    @Transactional
    public ThanhToan retryPayment(Integer paymentId, Integer userId) {
        ThanhToan payment = getPaymentById(paymentId);
        if (!Integer.valueOf(1).equals(payment.getTrangThaiThanhToan())
                && !Integer.valueOf(3).equals(payment.getTrangThaiThanhToan())) {
            throw new BadRequestException("Can only retry pending or failed payments");
        }
        if (!payment.getDonHang().getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Payment does not belong to current user");
        }
        payment.setTrangThaiThanhToan(1);
        payment.setMaGiaoDich("ORD-" + payment.getDonHang().getMaDonHang()
                + "-" + System.currentTimeMillis());
        payment.setThoiGianTt(null);
        payment.setThoiGianTao(LocalDateTime.now());
        return thanhToanRepository.save(payment);
    }
}