package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class YeuCauTraHangService {

    private final YeuCauTraHangRepository yeuCauTraHangRepository;
    private final DonHangRepository donHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final OrderSseService orderSseService;

    @Transactional
    public Map<String, Object> createReturnRequest(Integer orderId, Integer userId, String lyDo, String hinhAnh) {
        DonHang order = donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer currentStatus = order.getTrangThaiDon();
        if (!Integer.valueOf(6).equals(currentStatus)) {
            throw new BadRequestException("Chỉ có thể yêu cầu trả hàng cho đơn đã giao");
        }
        if (lyDo == null || lyDo.isBlank()) {
            throw new BadRequestException("Vui lòng nhập lý do trả hàng");
        }

        boolean hasPending = yeuCauTraHangRepository
                .findByDonHang_MaDonHangAndTrangThai(orderId, 1).isPresent();
        if (hasPending) {
            throw new BadRequestException("Đã có yêu cầu trả hàng đang chờ xử lý cho đơn này");
        }

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        YeuCauTraHang yeuCau = YeuCauTraHang.builder()
                .donHang(order)
                .nguoiDung(user)
                .lyDo(lyDo)
                .hinhAnh(hinhAnh)
                .trangThai(1)
                .build();
        yeuCau = yeuCauTraHangRepository.save(yeuCau);

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(7);
        donHangRepository.save(order);

        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(7)
                .nguoiCapNhat(user)
                .ghiChu(lyDo)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 7, oldStatus, "user", lyDo);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maYeuCau", yeuCau.getMaYeuCau());
        result.put("message", "Yêu cầu trả hàng đã được gửi");
        return result;
    }

    @Transactional
    public Map<String, Object> approveReturn(Integer requestId, Integer adminUserId) {
        YeuCauTraHang yeuCau = yeuCauTraHangRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request", requestId));
        if (!Integer.valueOf(1).equals(yeuCau.getTrangThai())) {
            throw new BadRequestException("Yêu cầu này đã được xử lý");
        }

        DonHang order = yeuCau.getDonHang();
        Integer oldStatus = order.getTrangThaiDon();

        yeuCau.setTrangThai(2);
        yeuCau.setNgayCapNhat(LocalDateTime.now());

        BigDecimal refundAmount = BigDecimal.ZERO;
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang());
        for (ThanhToan payment : payments) {
            if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) {
                refundAmount = refundAmount.add(payment.getSoTien());
                payment.setTrangThaiThanhToan(3);
                thanhToanRepository.save(payment);
            }
        }
        yeuCau.setSoTienHoan(refundAmount);

        boolean wasStockDeducted = wasStockDeductedForOrder(order);
        if (wasStockDeducted) {
            restoreStock(order.getMaDonHang());
        }

        if (order.getPhieuGiamGia() != null && order.getPhieuGiamGia().getSoLuong() != null) {
            PhieuGiamGia coupon = order.getPhieuGiamGia();
            coupon.setSoLuong(coupon.getSoLuong() + 1);
            phieuGiamGiaRepository.save(coupon);
        }

        order.setTrangThaiDon(8);
        donHangRepository.save(order);
        yeuCauTraHangRepository.save(yeuCau);

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(8)
                .nguoiCapNhat(admin)
                .ghiChu("Đã chấp nhận trả hàng - Hoàn " + refundAmount + "đ")
                .build());

        orderSseService.sendOrderStatusUpdate(order.getMaDonHang(), 8, oldStatus, "admin", "return_approved");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã chấp nhận trả hàng");
        result.put("soTienHoan", refundAmount);
        return result;
    }

    @Transactional
    public Map<String, Object> rejectReturn(Integer requestId, Integer adminUserId, String lyDoTuChoi) {
        YeuCauTraHang yeuCau = yeuCauTraHangRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request", requestId));
        if (!Integer.valueOf(1).equals(yeuCau.getTrangThai())) {
            throw new BadRequestException("Yêu cầu này đã được xử lý");
        }

        DonHang order = yeuCau.getDonHang();
        Integer oldStatus = order.getTrangThaiDon();
        Integer revertStatus = lichSuDonHangRepository
                .findByDonHang_MaDonHangOrderByThoiGianDesc(order.getMaDonHang())
                .stream()
                .filter(h -> Integer.valueOf(7).equals(h.getTrangThaiMoi()))
                .findFirst()
                .map(LichSuDonHang::getTrangThaiCu)
                .orElse(6);

        yeuCau.setTrangThai(3);
        yeuCau.setLyDoTuChoi(lyDoTuChoi);
        yeuCau.setNgayCapNhat(LocalDateTime.now());
        yeuCauTraHangRepository.save(yeuCau);

        order.setTrangThaiDon(revertStatus);
        donHangRepository.save(order);

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(revertStatus)
                .nguoiCapNhat(admin)
                .ghiChu("Từ chối trả hàng: " + (lyDoTuChoi != null ? lyDoTuChoi : "Không hợp lệ"))
                .build());

        orderSseService.sendOrderStatusUpdate(order.getMaDonHang(), revertStatus, oldStatus, "admin", "return_rejected");

        return Map.of("message", "Đã từ chối yêu cầu trả hàng");
    }

    public List<YeuCauTraHang> getAllRequests() {
        return yeuCauTraHangRepository.findAllByOrderByNgayTaoDesc();
    }

    public List<YeuCauTraHang> getRequestsByStatus(Integer trangThai) {
        return yeuCauTraHangRepository.findByTrangThaiOrderByNgayTaoDesc(trangThai);
    }

    public YeuCauTraHang getRequestById(Integer requestId) {
        return yeuCauTraHangRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request", requestId));
    }

    public long countByTrangThai(Integer trangThai) {
        return yeuCauTraHangRepository.countByTrangThai(trangThai);
    }

    public List<YeuCauTraHang> getUserRequests(Integer userId) {
        return yeuCauTraHangRepository.findByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(userId);
    }

    private boolean wasStockDeductedForOrder(DonHang order) {
        if (order.getTrangThaiDon() < 2) return false;
        return thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang()).stream()
                .anyMatch(t -> Integer.valueOf(1).equals(t.getPhuongThuc())
                        ? order.getTrangThaiDon() >= 2
                        : Integer.valueOf(2).equals(t.getTrangThaiThanhToan()));
    }

    private void restoreStock(Integer orderId) {
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }
}
