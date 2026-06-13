package com.example.zeststore.service;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
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

    public List<DonHang> getOrdersByUser(Integer userId) {
        return donHangRepository.findByNguoiDung_MaNguoiDung(userId);
    }

    public DonHang getOrderById(Integer orderId) {
        return donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    public List<DonHang> getAllOrders() {
        return donHangRepository.findAll();
    }

    public Map<String, Object> getOrderDetail(Integer orderId) {
        DonHang order = getOrderById(orderId);
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(orderId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", order);
        result.put("items", items);
        result.put("payments", payments);
        return result;
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
                    .orElseThrow(() -> new BadRequestException("Invalid coupon"));

            if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
                throw new BadRequestException("Minimum order value not met for this coupon");
            }

            if ("percent".equals(coupon.getKieuGiamGia())) {
                soTienGiam = tongTien.multiply(coupon.getGiaTriGiam())
                        .divide(BigDecimal.valueOf(100));
            } else {
                soTienGiam = coupon.getGiaTriGiam();
            }
            if (soTienGiam.compareTo(tongTien) > 0) {
                soTienGiam = tongTien;
            }
        }

        BigDecimal finalTotal = tongTien.subtract(soTienGiam);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        DonHang order = DonHang.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .soTienGiam(soTienGiam)
                .tongTien(finalTotal)
                .trangThaiDon("pending")
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
        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(request.getPhuongThucThanhToan())
                .trangThaiThanhToan(request.getPhuongThucThanhToan().equals("COD") ? "pending" : "pending")
                .soTien(finalTotal)
                .maGiaoDich(paymentRef)
                .transactionId(paymentRef)
                .build());

        mucGioHangRepository.deleteAll(cartItems);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", finalTotal);
        result.put("soTienGiam", soTienGiam);
        result.put("trangThai", order.getTrangThaiDon());
        result.put("message", "Order placed successfully");
        return result;
    }

    @Transactional
    public DonHang updateOrderStatus(Integer orderId, String status) {
        List<String> validStatuses = List.of("confirmed", "shipping", "delivered", "cancelled");
        if (!validStatuses.contains(status)) {
            throw new BadRequestException("Invalid status: " + status);
        }
        DonHang order = getOrderById(orderId);
        order.setTrangThaiDon(status);
        return donHangRepository.save(order);
    }

    @Transactional
    public void cancelOrder(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (!order.getTrangThaiDon().equals("pending")) {
            throw new BadRequestException("Can only cancel pending orders");
        }

        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }

        order.setTrangThaiDon("cancelled");
        donHangRepository.save(order);
    }
}
