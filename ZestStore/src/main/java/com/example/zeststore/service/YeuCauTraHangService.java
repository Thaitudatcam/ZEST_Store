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
    private final ThongBaoService thongBaoService;
    private final ViService viService;

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

        // Notify admins/staff about the return request.
        try {
            thongBaoService.taoThongBaoChoAdmin(
                    "Yêu cầu trả hàng #" + orderId,
                    "Khách " + user.getHoTen() + " yêu cầu trả đơn #" + orderId + ". Lý do: " + lyDo,
                    "YEU_CAU_TRA_HANG",
                    "/admin/returns");
        } catch (Exception ignored) {}

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

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0 && order.getNguoiDung() != null) {
            viService.napTien(order.getNguoiDung().getMaNguoiDung(), refundAmount,
                    "Hoàn tiền trả hàng - Đơn #" + order.getMaDonHang(), order.getMaDonHang());
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

        // Notify the customer that their return request was approved.
        try {
            thongBaoService.taoThongBao(
                    order.getNguoiDung().getMaNguoiDung(),
                    "Yêu cầu trả hàng #" + order.getMaDonHang() + " đã được chấp nhận",
                    "Đơn hàng #" + order.getMaDonHang() + " hoàn tiền " + refundAmount + "₫.",
                    "TRA_HANG_DUOC_CHAP_NHAN",
                    "/orders/" + order.getMaDonHang());
        } catch (Exception ignored) {}

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

        // Notify the customer that their return request was rejected.
        try {
            thongBaoService.taoThongBao(
                    order.getNguoiDung().getMaNguoiDung(),
                    "Yêu cầu trả hàng #" + order.getMaDonHang() + " bị từ chối",
                    "Lý do: " + (lyDoTuChoi != null ? lyDoTuChoi : "Không hợp lệ"),
                    "TRA_HANG_BI_TU_CHOI",
                    "/orders/" + order.getMaDonHang());
        } catch (Exception ignored) {}

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
            BienTheSanPham variant = bienTheRepository.findByIdForUpdate(item.getBienThe().getMaBienThe())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", item.getBienThe().getMaBienThe()));
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }
}
