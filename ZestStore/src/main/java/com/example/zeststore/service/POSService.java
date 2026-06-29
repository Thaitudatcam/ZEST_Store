package com.example.zeststore.service;

import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class POSService {

    private final BienTheSanPhamRepository bienTheRepository;
    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final PosCartRepository posCartRepository;

    @Transactional
    public Map<String, Object> createPosOrder(PosOrderRequest request, Integer adminUserId) {
        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        List<Map<String, Object>> orderItems = new ArrayList<>();
        BigDecimal tongTien = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (PosOrderRequest.PosItem req : request.getItems()) {
                BienTheSanPham variant = bienTheRepository.findById(req.getMaBienThe())
                        .orElseThrow(() -> new BadRequestException("Variant not found: " + req.getMaBienThe()));
                if (variant.getTonKho() < req.getSoLuong()) {
                    throw new BadRequestException("Insufficient stock for " + variant.getSku());
                }
                variant.setTonKho(variant.getTonKho() - req.getSoLuong());
                bienTheRepository.save(variant);
                BigDecimal thanhTien = variant.getGia().multiply(BigDecimal.valueOf(req.getSoLuong()));
                tongTien = tongTien.add(thanhTien);
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("bienThe", variant);
                itemMap.put("donGia", variant.getGia());
                itemMap.put("soLuong", req.getSoLuong());
                itemMap.put("thanhTien", thanhTien);
                orderItems.add(itemMap);
            }
        } else {
            List<PosCartItem> cartItems = posCartRepository.findByAdmin_MaNguoiDung(adminUserId);
            if (cartItems.isEmpty()) {
                throw new BadRequestException("Cart is empty");
            }
            for (PosCartItem cartItem : cartItems) {
                BienTheSanPham variant = cartItem.getBienThe();
                BigDecimal thanhTien = variant.getGia().multiply(BigDecimal.valueOf(cartItem.getSoLuong()));
                tongTien = tongTien.add(thanhTien);
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("bienThe", variant);
                itemMap.put("donGia", variant.getGia());
                itemMap.put("soLuong", cartItem.getSoLuong());
                itemMap.put("thanhTien", thanhTien);
                orderItems.add(itemMap);
            }
        }

        NguoiDung customer = null;
        if (request.getMaNguoiDung() != null) {
            customer = nguoiDungRepository.findById(request.getMaNguoiDung())
                    .orElseThrow(() -> new BadRequestException("Customer not found: " + request.getMaNguoiDung()));
        }

        BigDecimal soTienGiam = BigDecimal.ZERO;
        PhieuGiamGia coupon = null;
        if (request.getMaCode() != null && !request.getMaCode().trim().isEmpty()) {
            coupon = phieuGiamGiaRepository.findByMaCode(request.getMaCode().trim())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ"));

            if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
                throw new BadRequestException("Mã giảm giá không hoạt động");
            }
            LocalDateTime now = LocalDateTime.now();
            if (coupon.getNgayBatDau() != null && now.isBefore(coupon.getNgayBatDau())) {
                throw new BadRequestException("Mã giảm giá chưa đến hạn sử dụng");
            }
            if (coupon.getNgayKetThuc() != null && now.isAfter(coupon.getNgayKetThuc())) {
                throw new BadRequestException("Mã giảm giá đã hết hạn");
            }
            if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
                throw new BadRequestException("Đơn hàng tối thiểu " + coupon.getGiaTriDonToiThieu() + " để áp dụng mã này");
            }
            if (Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
                throw new BadRequestException("Mã freeship không áp dụng tại quầy");
            }

            if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
                soTienGiam = tongTien.multiply(coupon.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
            } else {
                soTienGiam = coupon.getGiaTriGiam();
            }
            if (soTienGiam.compareTo(tongTien) > 0) {
                soTienGiam = tongTien;
            }
            if (coupon.getGiaTriGiamToiDa() != null && soTienGiam.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
                soTienGiam = coupon.getGiaTriGiamToiDa();
            }
            if (coupon.getSoLuong() != null) {
                coupon.setSoLuong(coupon.getSoLuong() - 1);
                if (coupon.getSoLuong() <= 0) {
                    coupon.setTrangThai(0);
                }
                phieuGiamGiaRepository.save(coupon);
            }
        }

        String tenNguoiNhan = customer != null ? customer.getHoTen()
                : (request.getTenKhachHang() != null ? request.getTenKhachHang() : "Khách lẻ");
        String sdtNguoiNhan = customer != null ? customer.getSoDienThoai()
                : (request.getSdtKhachHang() != null ? request.getSdtKhachHang() : "0000000000");

        String code = "POS-" + System.currentTimeMillis();

        BigDecimal thanhToanTong = tongTien.subtract(soTienGiam).max(BigDecimal.ZERO);

        DonHang order = DonHang.builder()
                .nguoiDung(customer)
                .loaiDonHang(2)
                .maDonHangCode(code)
                .tongTien(thanhToanTong)
                .trangThaiDon(6)
                .tenNguoiNhan(tenNguoiNhan)
                .sdtNguoiNhan(sdtNguoiNhan)
                .diaChiGiaoHang("Tại quầy")
                .phiVanChuyen(BigDecimal.ZERO)
                .soTienGiam(soTienGiam)
                .phieuGiamGia(coupon)
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

        Integer phuongThuc = request.getPhuongThucThanhToan() != null ? request.getPhuongThucThanhToan() : 5;
        String nhaCungCap;
        Integer trangThaiThanhToan;
        if (Integer.valueOf(4).equals(phuongThuc)) {
            nhaCungCap = "ZaloPay";
            trangThaiThanhToan = 1;
        } else {
            nhaCungCap = "Tiền mặt";
            trangThaiThanhToan = 2;
        }

        String paymentRef = "POS-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(phuongThuc)
                .nhaCungCap(nhaCungCap)
                .trangThaiThanhToan(trangThaiThanhToan)
                .soTien(thanhToanTong)
                .maGiaoDich(paymentRef)
                .build());

        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(null)
                .trangThaiMoi(6)
                .nguoiCapNhat(admin)
                .ghiChu("Bán tại quầy")
                .build());

        posCartRepository.deleteByAdmin_MaNguoiDung(adminUserId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", tongTien);
        result.put("soTienGiam", soTienGiam);
        result.put("thanhToan", thanhToanTong);
        result.put("message", "Counter order created successfully");
        return result;
    }
}
