package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.ChiTietHoaDonRepository;
import com.example.zeststore.repository.HoaDonRepository;
import com.example.zeststore.repository.MucDonHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoaDonService {

    private final HoaDonRepository hoaDonRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;
    private final MucDonHangRepository mucDonHangRepository;

    @Transactional
    public void createInvoice(DonHang order) {
        if (hoaDonRepository.findByDonHang_MaDonHang(order.getMaDonHang()).isPresent()) {
            return;
        }

        String maHoaDonCode = "HD-" + order.getMaDonHang();
        String email = order.getNguoiDung().getEmail();

        HoaDon invoice = HoaDon.builder()
                .donHang(order)
                .maHoaDonCode(maHoaDonCode)
                .emailKhachHang(email)
                .tongTien(order.getTongTien())
                .trangThaiHoaDon("paid")
                .build();
        invoice = hoaDonRepository.save(invoice);

        List<MucDonHang> orderItems = mucDonHangRepository
                .findByDonHang_MaDonHang(order.getMaDonHang());

        for (MucDonHang item : orderItems) {
            BienTheSanPham variant = item.getBienThe();
            SanPham product = variant.getSanPham();

            String thongTinBienThe = (variant.getMauSac() != null ? variant.getMauSac().getMauSac() : "")
                    + (variant.getKichCo() != null ? " - " + variant.getKichCo().getKichCo() : "");

            chiTietHoaDonRepository.save(ChiTietHoaDon.builder()
                    .hoaDon(invoice)
                    .tenSanPham(product != null ? product.getTenSanPham() : "SP #" + variant.getMaBienThe())
                    .thongTinBienThe(thongTinBienThe)
                    .donGia(item.getDonGia())
                    .soLuong(item.getSoLuong())
                    .thanhTien(item.getThanhTien())
                    .build());
        }
    }
}
