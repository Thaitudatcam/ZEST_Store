package com.example.zeststore.service;

import com.example.zeststore.entity.DiemTichLuy;
import com.example.zeststore.entity.LichSuDiem;
import com.example.zeststore.repository.DiemTichLuyRepository;
import com.example.zeststore.repository.LichSuDiemRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiemExpiryJob {

    private final LichSuDiemRepository lichSuDiemRepository;
    private final DiemTichLuyRepository diemTichLuyRepository;
    private final NguoiDungRepository nguoiDungRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void expirePoints() {
        log.info("Starting point expiry job...");

        LocalDate today = LocalDate.now();
        List<LichSuDiem> expiredBatches = lichSuDiemRepository.findExpiredBatches(today);

        if (expiredBatches.isEmpty()) {
            log.info("No expired point batches found.");
            return;
        }

        Map<Integer, List<LichSuDiem>> grouped = expiredBatches.stream()
                .collect(Collectors.groupingBy(l -> l.getNguoiDung().getMaNguoiDung()));

        for (Map.Entry<Integer, List<LichSuDiem>> entry : grouped.entrySet()) {
            Integer maNguoiDung = entry.getKey();
            List<LichSuDiem> batches = entry.getValue();

            int totalExpired = batches.stream()
                    .filter(l -> l.getSoDuSau() > 0)
                    .mapToInt(LichSuDiem::getSoDuSau)
                    .sum();

            if (totalExpired <= 0) continue;

            DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung).orElse(null);
            if (viDiem == null) continue;

            int thucTeExpired = Math.min(totalExpired, viDiem.getSoDiem());
            if (thucTeExpired <= 0) continue;

            int soDuMoi = viDiem.getSoDiem() - thucTeExpired;

            lichSuDiemRepository.save(LichSuDiem.builder()
                    .nguoiDung(nguoiDungRepository.findById(maNguoiDung).orElse(null))
                    .loaiGiaoDich(3)
                    .soDiem(thucTeExpired)
                    .soDuSau(soDuMoi)
                    .thoiGian(LocalDateTime.now())
                    .build());

            viDiem.setSoDiem(soDuMoi);
            diemTichLuyRepository.save(viDiem);

            log.info("Expired {} points for user {}", thucTeExpired, maNguoiDung);
        }

        log.info("Point expiry job completed. Processed {} users.", grouped.size());
    }
}
