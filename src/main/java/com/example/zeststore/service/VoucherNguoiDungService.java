package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.CouponUsageLogRepository;
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
    private final PhieuGiamGiaService phieuGiamGiaService;
    private final CouponUsageLogRepository couponUsageLogRepository;

    /**
     * Lấy danh sách voucher cá nhân — chỉ trả về CHUA_NHAN và DA_NHAN,
     * ẩn hoàn toàn DA_DUNG và DA_THU_HOI.
     */
    public List<Map<String, Object>> getUserVouchers(Integer userId) {
        List<VoucherNguoiDung> list = voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungOrderByNgayNhanDesc(userId);
        return list.stream()
                .filter(v -> (v.getTrangThai() == TrangThaiVoucher.CHUA_NHAN
                        || v.getTrangThai() == TrangThaiVoucher.DA_NHAN)
                        && v.getPhieuGiamGia().getNgayXoa() == null
                        && Integer.valueOf(1).equals(v.getPhieuGiamGia().getTrangThai()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getUnclaimedCount(Integer userId) {
        long count = voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungOrderByNgayNhanDesc(userId)
                .stream()
                .filter(v -> v.getTrangThai() == TrangThaiVoucher.CHUA_NHAN
                        && v.getPhieuGiamGia().getNgayXoa() == null
                        && Integer.valueOf(1).equals(v.getPhieuGiamGia().getTrangThai()))
                .count();
        return Map.of("count", count);
    }

    /**
     * Đếm voucher còn dùng được (CHUA_NHAN + DA_NHAN) — dùng cho header badge.
     */
    public Map<String, Object> getUserVoucherCount(Integer userId) {
        long nhan = voucherNguoiDungRepository
                .countByNguoiDung_MaNguoiDungAndTrangThai(userId, TrangThaiVoucher.DA_NHAN);
        long chuaNhan = voucherNguoiDungRepository
                .countByNguoiDung_MaNguoiDungAndTrangThai(userId, TrangThaiVoucher.CHUA_NHAN);
        return Map.of("count", nhan + chuaNhan);
    }

    // ========== CLAIM (public coupon) ==========

    @Transactional
    public Map<String, Object> claimVoucher(Integer userId, String maCode) {
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCodeForUpdate(maCode)
                .orElseThrow(() -> new BadRequestException("Mã voucher không hợp lệ"));

        if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
            throw new BadRequestException("Voucher đã ngừng hoạt động");
        }
        if (!Boolean.TRUE.equals(coupon.getCongKhai())) {
            throw new BadRequestException("Voucher riêng chỉ có thể nhận từ chương trình hoặc quản trị viên");
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
                .findByUserAndCouponAndStatusIn(userId, coupon.getMaPhieuGiamGia(),
                        List.of(TrangThaiVoucher.CHUA_NHAN, TrangThaiVoucher.DA_NHAN, TrangThaiVoucher.DA_DUNG))
                .isPresent();
        if (alreadyClaimed) {
            throw new BadRequestException("Bạn đã nhận voucher này rồi");
        }
        if (couponUsageLogRepository.hasActiveUsage(maCode, userId)) {
            throw new BadRequestException("Bạn đã sử dụng mã này");
        }

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (coupon.getSoLuong() != null) {
            coupon.setSoLuong(coupon.getSoLuong() - 1);
            phieuGiamGiaRepository.save(coupon);
        }

        VoucherNguoiDung v = VoucherNguoiDung.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .trangThai(TrangThaiVoucher.DA_NHAN)
                .build();
        voucherNguoiDungRepository.save(v);

        return Map.of("message", "Nhận voucher thành công", "maCode", coupon.getMaCode());
    }

    // ========== GRANT (admin tặng) ==========

    @Transactional
    public Map<String, Object> grantVoucher(Integer userId, Integer couponId) {
        PhieuGiamGia coupon = phieuGiamGiaRepository.findById(couponId)
                .orElseThrow(() -> new BadRequestException("Mã giảm giá không tồn tại"));

        if (!Integer.valueOf(1).equals(coupon.getTrangThai()) || coupon.getNgayXoa() != null) {
            throw new BadRequestException("Mã giảm giá đã ngừng hoạt động");
        }
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getNgayBatDau() != null && now.isBefore(coupon.getNgayBatDau())) {
            throw new BadRequestException("Mã giảm giá chưa đến hạn sử dụng");
        }
        if (coupon.getNgayKetThuc() != null && now.isAfter(coupon.getNgayKetThuc())) {
            throw new BadRequestException("Mã giảm giá đã hết hạn");
        }
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
            throw new BadRequestException("Mã giảm giá đã hết lượt");
        }

        boolean already = voucherNguoiDungRepository
                .findByUserAndCouponAndStatusIn(userId, couponId,
                        List.of(TrangThaiVoucher.CHUA_NHAN, TrangThaiVoucher.DA_NHAN, TrangThaiVoucher.DA_DUNG))
                .isPresent();
        if (already) {
            throw new BadRequestException("Người dùng này đã có voucher này rồi");
        }

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (coupon.getSoLuong() != null) {
            coupon.setSoLuong(coupon.getSoLuong() - 1);
            phieuGiamGiaRepository.save(coupon);
        }

        VoucherNguoiDung v = VoucherNguoiDung.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .trangThai(TrangThaiVoucher.CHUA_NHAN)
                .ngayHetHan(LocalDateTime.now().plusDays(7))
                .build();
        voucherNguoiDungRepository.save(v);

        return Map.of("message", "Cấp voucher thành công",
                "maVoucherNguoiDung", v.getMaVoucherNguoiDung());
    }

    // ========== ACCEPT (user nhận voucher được tặng) ==========

    @Transactional
    public Map<String, Object> acceptVoucher(Integer maVoucherNguoiDung, Integer userId) {
        VoucherNguoiDung v = voucherNguoiDungRepository.findById(maVoucherNguoiDung)
                .orElseThrow(() -> new BadRequestException("Voucher không tồn tại"));

        if (!v.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Voucher không thuộc về bạn");
        }
        if (v.getTrangThai() != TrangThaiVoucher.CHUA_NHAN) {
            throw new BadRequestException("Voucher không ở trạng thái chờ nhận");
        }
        if (v.getNgayHetHan() != null && LocalDateTime.now().isAfter(v.getNgayHetHan())) {
            throw new BadRequestException("Voucher đã hết thời hạn nhận");
        }

        v.setTrangThai(TrangThaiVoucher.DA_NHAN);
        v.setNgayHetHan(null);
        voucherNguoiDungRepository.save(v);

        return Map.of("message", "Nhận voucher thành công");
    }

    // ========== REVOKE (admin thu hồi) ==========

    @Transactional
    public Map<String, Object> revokeVoucher(Integer maVoucherNguoiDung) {
        VoucherNguoiDung v = voucherNguoiDungRepository.findById(maVoucherNguoiDung)
                .orElseThrow(() -> new BadRequestException("Voucher không tồn tại"));

        if (v.getTrangThai() != TrangThaiVoucher.CHUA_NHAN) {
            throw new BadRequestException("Chỉ có thể thu hồi voucher ở trạng thái chờ nhận");
        }

        v.setTrangThai(TrangThaiVoucher.DA_THU_HOI);
        voucherNguoiDungRepository.save(v);
        phieuGiamGiaService.restoreCoupon(v.getPhieuGiamGia());

        return Map.of("message", "Thu hồi voucher thành công");
    }

    // ========== MARK AS USED ==========

    @Transactional
    public void markAsUsed(Integer userId, Integer maPhieuGiamGia) {
        voucherNguoiDungRepository
                .findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(userId, maPhieuGiamGia)
                .ifPresent(v -> {
                    v.setTrangThai(TrangThaiVoucher.DA_DUNG);
                    v.setNgaySuDung(LocalDateTime.now());
                    voucherNguoiDungRepository.save(v);
                });
    }

    // ========== HELPER ==========

    private Map<String, Object> toMap(VoucherNguoiDung v) {
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
        m.put("ngayHetHan", v.getNgayHetHan());
        m.put("trangThai", v.getTrangThai().getValue());
        m.put("ngayKetThuc", p.getNgayKetThuc());
        return m;
    }
}
