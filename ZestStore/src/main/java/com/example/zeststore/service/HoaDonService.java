package com.example.zeststore.service;

import com.example.zeststore.entity.ChiTietHoaDon;
import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.HoaDon;
import com.example.zeststore.entity.MucDonHang;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HoaDonService {

    private final HoaDonRepository hoaDonRepository;
    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;

    public List<Map<String, Object>> getAllInvoices() {
        return hoaDonRepository.findAll().stream().map(inv -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maHoaDon", inv.getMaHoaDon());
            m.put("maHoaDonCode", inv.getMaHoaDonCode());
            m.put("maDonHang", inv.getDonHang().getMaDonHang());
            m.put("emailKhachHang", inv.getEmailKhachHang());
            m.put("tongTien", inv.getTongTien());
            m.put("trangThaiHoaDon", inv.getTrangThaiHoaDon());
            m.put("ngayTao", inv.getNgayTao());
            m.put("khachHang", inv.getDonHang().getNguoiDung().getHoTen());
            return m;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getInvoiceDetail(Integer id) {
        HoaDon invoice = hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
        List<ChiTietHoaDon> items = chiTietHoaDonRepository.findByHoaDon_MaHoaDon(id);
        DonHang order = invoice.getDonHang();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maHoaDon", invoice.getMaHoaDon());
        result.put("maHoaDonCode", invoice.getMaHoaDonCode());
        result.put("trangThaiHoaDon", invoice.getTrangThaiHoaDon());
        result.put("ngayTao", invoice.getNgayTao());
        result.put("emailKhachHang", invoice.getEmailKhachHang());
        result.put("tongTien", invoice.getTongTien());

        Map<String, Object> orderInfo = new LinkedHashMap<>();
        orderInfo.put("maDonHang", order.getMaDonHang());
        orderInfo.put("tenNguoiNhan", order.getTenNguoiNhan());
        orderInfo.put("sdtNguoiNhan", order.getSdtNguoiNhan());
        orderInfo.put("diaChiGiaoHang", order.getDiaChiGiaoHang());
        orderInfo.put("ngayDat", order.getNgayDat());
        orderInfo.put("soTienGiam", order.getSoTienGiam());
        orderInfo.put("phiVanChuyen", order.getPhiVanChuyen());
        orderInfo.put("tongTien", order.getTongTien());
        orderInfo.put("khachHang", order.getNguoiDung().getHoTen());
        result.put("donHang", orderInfo);

        result.put("chiTiet", items.stream().map(item -> {
            Map<String, Object> im = new LinkedHashMap<>();
            im.put("tenSanPham", item.getTenSanPham());
            im.put("thongTinBienThe", item.getThongTinBienThe());
            im.put("donGia", item.getDonGia());
            im.put("soLuong", item.getSoLuong());
            im.put("thanhTien", item.getThanhTien());
            return im;
        }).collect(Collectors.toList()));

        return result;
    }

    @Transactional
    public Map<String, Object> generateInvoice(Integer orderId) {
        Optional<HoaDon> existing = hoaDonRepository.findByDonHang_MaDonHang(orderId);
        if (existing.isPresent()) {
            throw new RuntimeException("Invoice already exists for this order");
        }

        DonHang order = donHangRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        List<MucDonHang> orderItems = mucDonHangRepository.findByDonHang_MaDonHang(orderId);

        String code = "HD-" + orderId + "-" + System.currentTimeMillis();

        HoaDon invoice = HoaDon.builder()
                .donHang(order)
                .maHoaDonCode(code)
                .emailKhachHang(order.getNguoiDung().getEmail() != null ? order.getNguoiDung().getEmail() : "")
                .tongTien(order.getTongTien())
                .build();
        invoice = hoaDonRepository.save(invoice);

        for (MucDonHang item : orderItems) {
            String thongTin = "";
            if (item.getBienThe().getMauSac() != null) {
                thongTin += item.getBienThe().getMauSac().getMauSac();
            }
            if (item.getBienThe().getKichCo() != null) {
                thongTin += (thongTin.isEmpty() ? "" : " / ") + item.getBienThe().getKichCo().getKichCo();
            }

            chiTietHoaDonRepository.save(ChiTietHoaDon.builder()
                    .hoaDon(invoice)
                    .tenSanPham(item.getBienThe().getSanPham().getTenSanPham())
                    .thongTinBienThe(thongTin)
                    .donGia(item.getDonGia())
                    .soLuong(item.getSoLuong())
                    .thanhTien(item.getThanhTien())
                    .build());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maHoaDon", invoice.getMaHoaDon());
        result.put("maHoaDonCode", code);
        result.put("message", "Invoice generated successfully");
        return result;
    }
}
