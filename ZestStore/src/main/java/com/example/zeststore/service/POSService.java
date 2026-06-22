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
    private final HoaDonService hoaDonService;

    @Transactional
    public Map<String, Object> createPosOrder(PosOrderRequest request, Integer adminUserId) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("No items in order");
        }

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        BigDecimal tongTien = BigDecimal.ZERO;
        List<Map<String, Object>> orderItems = new ArrayList<>();

        for (PosOrderRequest.PosItem req : request.getItems()) {
            BienTheSanPham variant = bienTheRepository.findById(req.getMaBienThe())
                    .orElseThrow(() -> new BadRequestException("Variant not found: " + req.getMaBienThe()));

            if (variant.getTonKho() < req.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku());
            }

            BigDecimal thanhTien = variant.getGia().multiply(BigDecimal.valueOf(req.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            variant.setTonKho(variant.getTonKho() - req.getSoLuong());
            bienTheRepository.save(variant);

            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("bienThe", variant);
            itemMap.put("donGia", variant.getGia());
            itemMap.put("soLuong", req.getSoLuong());
            itemMap.put("thanhTien", thanhTien);
            orderItems.add(itemMap);
        }

        String tenNguoiNhan = request.getTenKhachHang() != null ? request.getTenKhachHang() : "Khách lẻ";
        String sdtNguoiNhan = request.getSdtKhachHang() != null ? request.getSdtKhachHang() : "0000000000";

        String code = "POS-" + System.currentTimeMillis();

        DonHang order = DonHang.builder()
                .nguoiDung(admin)
                .loaiDonHang(2)
                .maDonHangCode(code)
                .tongTien(tongTien)
                .trangThaiDon(6)
                .tenNguoiNhan(tenNguoiNhan)
                .sdtNguoiNhan(sdtNguoiNhan)
                .diaChiGiaoHang("Tại quầy")
                .phiVanChuyen(BigDecimal.ZERO)
                .soTienGiam(BigDecimal.ZERO)
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

        String paymentRef = "POS-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(5)
                .nhaCungCap("Tiền mặt")
                .trangThaiThanhToan(2)
                .soTien(tongTien)
                .maGiaoDich(paymentRef)
                .build());

        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(null)
                .trangThaiMoi(6)
                .nguoiCapNhat(admin)
                .ghiChu("Bán tại quầy")
                .build());

        try {
            hoaDonService.generateInvoice(order.getMaDonHang());
        } catch (Exception ignored) {}

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", tongTien);
        result.put("message", "Counter order created successfully");
        return result;
    }
}
