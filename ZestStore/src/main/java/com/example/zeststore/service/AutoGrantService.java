package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.repository.VoucherNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutoGrantService {

    private final ChuongTrinhQuaTangRepository campaignRepository;
    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final NguoiDungRepository nguoiDungRepository;

    // ========== DANG_KY_MOI ==========

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDangKyMoi(NguoiDung user) {
        try {
            List<ChuongTrinhQuaTang> campaigns = campaignRepository
                    .findByTrangThaiAndLoaiTrigger(1, LoaiTrigger.DANG_KY_MOI);
            for (ChuongTrinhQuaTang c : campaigns) {
                grantFromCampaign(user, c);
            }
        } catch (Exception e) {
            log.error("AutoGrant DANG_KY_MOI failed for user {}: {}", user.getMaNguoiDung(), e.getMessage());
        }
    }

    // ========== QUAY_LAI ==========

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleQuayLai(NguoiDung user, long diffDays) {
        try {
            List<ChuongTrinhQuaTang> campaigns = campaignRepository
                    .findByTrangThaiAndLoaiTrigger(1, LoaiTrigger.QUAY_LAI);
            for (ChuongTrinhQuaTang c : campaigns) {
                if (c.getSoNgayKhongHoatDong() != null && diffDays >= c.getSoNgayKhongHoatDong()) {
                    grantFromCampaign(user, c);
                }
            }
        } catch (Exception e) {
            log.error("AutoGrant QUAY_LAI failed for user {}: {}", user.getMaNguoiDung(), e.getMessage());
        }
    }

    // ========== SU_KIEN (batch) ==========

    @Transactional
    public void launchCampaign(ChuongTrinhQuaTang campaign) {
        campaign.setDaChayXong(true);
        campaignRepository.saveAndFlush(campaign);
        batchGrant(campaign);
    }

    @Transactional
    public void batchGrant(ChuongTrinhQuaTang campaign) {
        PhieuGiamGia coupon = campaign.getPhieuGiamGia();
        List<NguoiDung> targets;
        if (campaign.getDoiTuong() == DoiTuongEnum.TAT_CA) {
            targets = nguoiDungRepository.findAll().stream()
                    .filter(u -> Integer.valueOf(1).equals(u.getTrangThai()))
                    .toList();
        } else {
            targets = nguoiDungRepository.findCustomersDaMuaHang();
        }
        int granted = 0;
        int skipped = 0;
        for (NguoiDung user : targets) {
            if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
                log.warn("Campaign {}: coupon {} het soLuong, stopped after {} grants",
                        campaign.getMaChuongTrinh(), coupon.getMaCode(), granted);
                break;
            }
            if (voucherNguoiDungRepository.existsByNguoiDung_MaNguoiDungAndChuongTrinhQuaTang_MaChuongTrinh(
                    user.getMaNguoiDung(), campaign.getMaChuongTrinh())) {
                skipped++;
                continue;
            }
            try {
                doGrant(user, coupon, campaign);
                granted++;
            } catch (Exception e) {
                log.error("Campaign {}: grant failed for user {}: {}",
                        campaign.getMaChuongTrinh(), user.getMaNguoiDung(), e.getMessage());
                skipped++;
            }
        }
        log.info("Campaign {} batch done: {} granted, {} skipped", campaign.getMaChuongTrinh(), granted, skipped);
    }

    // ========== CORE GRANT ==========

    private void grantFromCampaign(NguoiDung user, ChuongTrinhQuaTang campaign) {
        LocalDateTime now = LocalDateTime.now();
        if (campaign.getNgayBatDau() != null && now.isBefore(campaign.getNgayBatDau())) return;
        if (campaign.getNgayKetThuc() != null && now.isAfter(campaign.getNgayKetThuc())) return;
        if (voucherNguoiDungRepository.existsByNguoiDung_MaNguoiDungAndChuongTrinhQuaTang_MaChuongTrinh(
                user.getMaNguoiDung(), campaign.getMaChuongTrinh())) {
            return;
        }
        PhieuGiamGia coupon = campaign.getPhieuGiamGia();
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
            log.warn("Campaign {}: coupon {} out of stock", campaign.getMaChuongTrinh(), coupon.getMaCode());
            return;
        }
        doGrant(user, coupon, campaign);
    }

    private void doGrant(NguoiDung user, PhieuGiamGia coupon, ChuongTrinhQuaTang campaign) {
        if (coupon.getSoLuong() != null) {
            coupon.setSoLuong(coupon.getSoLuong() - 1);
            if (coupon.getSoLuong() <= 0) {
                coupon.setTrangThai(0);
            }
            phieuGiamGiaRepository.save(coupon);
        }
        VoucherNguoiDung v = VoucherNguoiDung.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .chuongTrinhQuaTang(campaign)
                .trangThai(TrangThaiVoucher.CHUA_NHAN)
                .ngayHetHan(LocalDateTime.now().plusDays(7))
                .build();
        voucherNguoiDungRepository.save(v);
        log.info("Granted campaign {} (coupon {}) to user {}", campaign.getMaChuongTrinh(), coupon.getMaCode(), user.getMaNguoiDung());
    }
}
