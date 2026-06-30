package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.PhieuGiamGia;
import com.example.zeststore.entity.VoucherNguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.repository.VoucherNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherNguoiDungService {

    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;

    public List<Map<String, Object>> getUserVouchers(Integer userId) {
        List<VoucherNguoiDung> list = voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungOrderByNgayNhanDesc(userId);
        return list.stream().map(v -> {
            PhieuGiamGia p = v.getPhieuGiamGia();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maVoucherNguoiDung", v.getMaVoucherNguoiDung());
            m.put("maCode", p.getMaCode());
            m.put("kieuGiamGia", p.getKieuGiamGia());
            m.put("giaTriGiam", p.getGiaTriGiam());
            m.put("giaTriDonToiThieu", p.getGiaTriDonToiThieu());
            m.put("giaTriGiamToiDa", p.getGiaTriGiamToiDa());
            m.put("ngayNhan", v.getNgayNhan());
            m.put("ngaySuDung", v.getNgaySuDung());
            m.put("trangThai", v.getTrangThai());
            m.put("ngayKetThuc", p.getNgayKetThuc());
            return m;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getUserVoucherCount(Integer userId) {
        long count = voucherNguoiDungRepository
                .countByNguoiDung_MaNguoiDungAndTrangThai(userId, 1);
        return Map.of("count", count);
    }

    @Transactional
    public Map<String, Object> claimVoucher(Integer userId, String maCode) {
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCode(maCode)
                .orElseThrow(() -> new BadRequestException("Mã voucher không hợp lệ"));

        if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
            throw new BadRequestException("Voucher đã ngừng hoạt động");
        }
        if (coupon.getNgayBatDau() != null && LocalDateTime.now().isBefore(coupon.getNgayBatDau())) {
            throw new BadRequestException("Voucher chưa đến hạn sử dụng");
        }
        if (coupon.getNgayKetThuc() != null && LocalDateTime.now().isAfter(coupon.getNgayKetThuc())) {
            throw new BadRequestException("Voucher đã hết hạn");
        }
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
            throw new BadRequestException("Voucher đã hết lượt");
        }

        boolean alreadyClaimed = voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(userId, coupon.getMaPhieuGiamGia())
                .isPresent();
        if (alreadyClaimed) {
            throw new BadRequestException("Bạn đã nhận voucher này rồi");
        }

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        VoucherNguoiDung v = VoucherNguoiDung.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .trangThai(1)
                .build();
        voucherNguoiDungRepository.save(v);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Nhận voucher thành công");
        result.put("maCode", coupon.getMaCode());
        return result;
    }

    @Transactional
    public void markAsUsed(Integer userId, Integer maPhieuGiamGia) {
        voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(userId, maPhieuGiamGia)
                .ifPresent(v -> {
                    v.setTrangThai(2);
                    v.setNgaySuDung(LocalDateTime.now());
                    voucherNguoiDungRepository.save(v);
                });
    }
}
