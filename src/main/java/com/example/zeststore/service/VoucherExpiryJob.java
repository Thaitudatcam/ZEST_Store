package com.example.zeststore.service;

import com.example.zeststore.entity.TrangThaiVoucher;
import com.example.zeststore.entity.VoucherNguoiDung;
import com.example.zeststore.repository.VoucherNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherExpiryJob {

    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void expireUnclaimedVouchers() {
        LocalDateTime now = LocalDateTime.now();
        List<VoucherNguoiDung> expired = voucherNguoiDungRepository
                .findExpiredByStatus(TrangThaiVoucher.CHUA_NHAN, now);
        for (VoucherNguoiDung v : expired) {
            v.setTrangThai(TrangThaiVoucher.DA_THU_HOI);
            voucherNguoiDungRepository.save(v);
        }
        if (!expired.isEmpty()) {
            log.info("Expired {} unclaimed vouchers", expired.size());
        }
    }
}
