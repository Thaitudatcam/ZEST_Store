package com.example.zeststore.service;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DonHangService {

    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final GioHangRepository gioHangRepository;
    private final MucGioHangRepository mucGioHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final HoaDonService hoaDonService;
    private final OrderSseService orderSseService;
    private final GhnService ghnService;

    @Transactional(readOnly = true)
    public List<DonHang> getOrdersByUser(Integer userId) {
        return donHangRepository.findByNguoiDung_MaNguoiDungOrderByNgayDatDesc(userId);
    }

    @Transactional(readOnly = true)
    public DonHang getOrderById(Integer orderId) {
        return donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    @Transactional(readOnly = true)
    public Page<DonHang> getAllOrders(int page, int size, Integer loaiDonHang) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayDat"));
        if (loaiDonHang != null) {
            return donHangRepository.findByLoaiDonHang(loaiDonHang, pageable);
        }
        return donHangRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetail(Integer orderId) {
        DonHang order = getOrderById(orderId);
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(orderId);

        List<LichSuDonHang> history = lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(orderId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", order);
        result.put("items", items);
        result.put("payments", payments);
        result.put("history", history);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetailForUser(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to current user");
        }
        return getOrderDetail(orderId);
    }

    @Transactional
    public Map<String, Object> placeOrder(Integer userId, OrderRequest request) {
        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        GioHang cart = gioHangRepository.findByNguoiDung_MaNguoiDung(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        List<MucGioHang> cartItems = mucGioHangRepository.findByGioHang_MaGioHang(cart.getMaGioHang());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        if (request.getMaBienTheList() != null && !request.getMaBienTheList().isEmpty()) {
            cartItems = cartItems.stream()
                    .filter(ci -> request.getMaBienTheList().contains(ci.getBienThe().getMaBienThe()))
                    .collect(java.util.stream.Collectors.toList());
            if (cartItems.isEmpty()) {
                throw new BadRequestException("No matching items in cart");
            }
        }

        BigDecimal tongTien = BigDecimal.ZERO;
        List<Map<String, Object>> orderItems = new ArrayList<>();

        for (MucGioHang cartItem : cartItems) {
            BienTheSanPham variant = cartItem.getBienThe();
            if (variant.getTonKho() < cartItem.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku());
            }
            BigDecimal thanhTien = variant.getGia().multiply(BigDecimal.valueOf(cartItem.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            variant.setTonKho(variant.getTonKho() - cartItem.getSoLuong());
            bienTheRepository.save(variant);

            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("bienThe", variant);
            itemMap.put("donGia", variant.getGia());
            itemMap.put("soLuong", cartItem.getSoLuong());
            itemMap.put("thanhTien", thanhTien);
            orderItems.add(itemMap);
        }

        BigDecimal soTienGiam = BigDecimal.ZERO;
        PhieuGiamGia coupon = null;
        if (request.getMaCode() != null && !request.getMaCode().isEmpty()) {
            coupon = phieuGiamGiaRepository.findByMaCode(request.getMaCode())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ"));

            if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
                throw new BadRequestException("Mã giảm giá đã ngừng hoạt động");
            }
            if (coupon.getNgayBatDau() != null && LocalDateTime.now().isBefore(coupon.getNgayBatDau())) {
                throw new BadRequestException("Mã giảm giá chưa đến hạn sử dụng");
            }
            if (coupon.getNgayKetThuc() != null && LocalDateTime.now().isAfter(coupon.getNgayKetThuc())) {
                throw new BadRequestException("Mã giảm giá đã hết hạn");
            }
            if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
                throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
            }
            if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
                throw new BadRequestException("Chưa đạt giá trị đơn tối thiểu để áp dụng mã này");
            }

            if (Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
                // FREESHIP: giảm trên phí ship, không giảm tiền SP
                soTienGiam = BigDecimal.ZERO;
            } else if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
                soTienGiam = tongTien.multiply(coupon.getGiaTriGiam())
                        .divide(BigDecimal.valueOf(100));
            } else {
                soTienGiam = coupon.getGiaTriGiam();
            }
            if (soTienGiam.compareTo(tongTien) > 0) {
                soTienGiam = tongTien;
            }
            if (coupon.getGiaTriGiamToiDa() != null && soTienGiam.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
                soTienGiam = coupon.getGiaTriGiamToiDa();
            }
        }

        BigDecimal phiVanChuyen = recalculateShippingFee(request, orderItems);
        if (coupon != null && Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
            BigDecimal giamShip = (coupon.getGiaTriGiam() == null || coupon.getGiaTriGiam().compareTo(BigDecimal.ZERO) == 0)
                ? phiVanChuyen
                : coupon.getGiaTriGiam().min(phiVanChuyen);
            phiVanChuyen = phiVanChuyen.subtract(giamShip).max(BigDecimal.ZERO);
        }
        BigDecimal finalTotal = tongTien.subtract(soTienGiam).add(phiVanChuyen);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        DonHang order = DonHang.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .maDonHangCode("ORD-" + System.currentTimeMillis())
                .soTienGiam(soTienGiam)
                .phiVanChuyen(phiVanChuyen)
                .tongTien(finalTotal)
                .trangThaiDon(1)
                .tenNguoiNhan(request.getTenNguoiNhan())
                .sdtNguoiNhan(request.getSdtNguoiNhan())
                .diaChiGiaoHang(request.getDiaChiGiaoHang())
                .ghiChu(request.getGhiChu())
                .build();
        order = donHangRepository.save(order);

        for (Map<String, Object> item : orderItems) {
            BienTheSanPham variant = (BienTheSanPham) item.get("bienThe");
            mucDonHangRepository.save(MucDonHang.builder()
                    .donHang(order)
                    .bienThe(variant)
                    .donGia((BigDecimal) item.get("donGia"))
                    .soLuong((Integer) item.get("soLuong"))
                    .thanhTien((BigDecimal) item.get("thanhTien"))
                    .build());
        }

        String paymentRef = "ORD-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        String nhaCungCap = switch (request.getPhuongThucThanhToan()) {
            case 2 -> "VNPay";
            case 3 -> "MoMo";
            case 4 -> "ZaloPay";
            default -> "Tiền mặt";
        };
        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(request.getPhuongThucThanhToan())
                .nhaCungCap(nhaCungCap)
                .trangThaiThanhToan(1)
                .soTien(finalTotal)
                .maGiaoDich(paymentRef)
                .build());

        if (Integer.valueOf(1).equals(request.getPhuongThucThanhToan())) {
            hoaDonService.generateInvoice(order.getMaDonHang());
        }

        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(null)
                .trangThaiMoi(1)
                .nguoiCapNhat(user)
                .build());

        if (Integer.valueOf(1).equals(request.getPhuongThucThanhToan())) {
            mucGioHangRepository.deleteAll(cartItems);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", finalTotal);
        result.put("soTienGiam", soTienGiam);
        result.put("phiVanChuyen", phiVanChuyen);
        result.put("trangThai", order.getTrangThaiDon());
        result.put("phuongThucThanhToan", request.getPhuongThucThanhToan());
        result.put("message", "Order placed successfully");
        return result;
    }

    @Transactional
    public DonHang updateOrderStatus(Integer orderId, Integer status, Integer adminUserId) {
        List<Integer> validStatuses = List.of(2, 3, 4, 5, 6, 7, 8, 9);
        if (!validStatuses.contains(status)) {
            throw new BadRequestException("Invalid status: " + status);
        }
        DonHang order = getOrderById(orderId);
        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(status);

        if (Integer.valueOf(8).equals(status) || Integer.valueOf(9).equals(status)) {
            restoreStock(orderId);
            thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                    .findFirst()
                    .ifPresent(t -> {
                        t.setTrangThaiThanhToan(3);
                        thanhToanRepository.save(t);
                    });
        }

        if (Integer.valueOf(4).equals(status) || Integer.valueOf(6).equals(status)) {
            thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                    .findFirst()
                    .ifPresent(t -> {
                        t.setTrangThaiThanhToan(2);
                        t.setThoiGianTt(LocalDateTime.now());
                        thanhToanRepository.save(t);
                    });
        }

        order = donHangRepository.save(order);

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(status)
                .nguoiCapNhat(admin)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, status, oldStatus, "admin", null);

        return order;
    }

    @Transactional
    public Map<String, String> confirmReceived(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (!Integer.valueOf(4).equals(order.getTrangThaiDon())) {
            throw new BadRequestException("Can only confirm received orders that are delivered");
        }

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(6);

        thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                .findFirst()
                .ifPresent(t -> {
                    t.setTrangThaiThanhToan(2);
                    t.setThoiGianTt(LocalDateTime.now());
                    thanhToanRepository.save(t);
                });

        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(6)
                .nguoiCapNhat(user)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 6, oldStatus, "user", null);

        return Map.of("message", "Order confirmed as received");
    }

    @Transactional
    public Map<String, String> requestReturn(Integer orderId, Integer userId, String lyDo) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer currentStatus = order.getTrangThaiDon();
        if (!Integer.valueOf(4).equals(currentStatus) && !Integer.valueOf(6).equals(currentStatus)) {
            throw new BadRequestException("Can only request return for delivered or completed orders");
        }
        if (lyDo == null || lyDo.isBlank()) {
            throw new BadRequestException("Return reason is required");
        }

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(7);
        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(7)
                .nguoiCapNhat(user)
                .ghiChu(lyDo)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 7, oldStatus, "user", lyDo);

        return Map.of("message", "Return requested");
    }

    private BigDecimal recalculateShippingFee(OrderRequest request, List<Map<String, Object>> orderItems) {
        if (request.getToDistrictId() == null || request.getToWardCode() == null) {
            return request.getPhiVanChuyen() != null ? request.getPhiVanChuyen() : BigDecimal.ZERO;
        }

        int weight = request.getWeight() != null ? request.getWeight()
                : orderItems.stream().mapToInt(item -> ((Integer) item.get("soLuong")) * 500).sum();
        weight = Math.max(weight, 500);

        Map<String, Object> result = ghnService.calculateFee(2, request.getToDistrictId(), request.getToWardCode(), weight);
        if (result.containsKey("error")) {
            throw new BadRequestException("Không thể tính phí vận chuyển, vui lòng thử lại sau");
        }

        Object data = result.get("data");
        if (data instanceof Map) {
            Object total = ((Map<?, ?>) data).get("total");
            if (total instanceof Number) {
                return BigDecimal.valueOf(((Number) total).longValue());
            }
        }
        throw new BadRequestException("GHN trả về dữ liệu phí vận chuyển không hợp lệ");
    }

    private void restoreStock(Integer orderId) {
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }

    @Transactional
    public Map<String, String> cancelOrder(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer stt = order.getTrangThaiDon();
        if (!Integer.valueOf(1).equals(stt) && !Integer.valueOf(2).equals(stt) && !Integer.valueOf(4).equals(stt)) {
            throw new BadRequestException("Chỉ có thể hủy đơn ở trạng thái chờ xác nhận, đã xác nhận hoặc chờ giao hàng");
        }

        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }

        if (order.getPhieuGiamGia() != null && order.getPhieuGiamGia().getSoLuong() != null) {
            PhieuGiamGia coupon = order.getPhieuGiamGia();
            coupon.setSoLuong(coupon.getSoLuong() + 1);
            phieuGiamGiaRepository.save(coupon);
        }

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(5);
        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(5)
                .nguoiCapNhat(user)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 5, oldStatus, "user", null);

        return Map.of("message", "Order cancelled");
    }
}