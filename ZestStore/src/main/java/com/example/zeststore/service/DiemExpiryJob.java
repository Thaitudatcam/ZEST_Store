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

        LocalDateTime now = LocalDateTime.now();
        List<LichSuDiem> expiredBatches = lichSuDiemRepository.findExpiredBatches(now);

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
                    .filter(l -> l.getSoDiemConLai() != null && l.getSoDiemConLai() > 0)
                    .mapToInt(LichSuDiem::getSoDiemConLai)
                    .sum();

            if (totalExpired <= 0) continue;

            DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung).orElse(null);
            if (viDiem == null) continue;

            int thucTeExpired = Math.min(totalExpired, viDiem.getSoDiemHienTai());
            if (thucTeExpired <= 0) continue;

            int conHetHan = thucTeExpired;
            for (LichSuDiem batch : batches) {
                if (conHetHan <= 0) break;
                if (batch.getSoDiemConLai() == null || batch.getSoDiemConLai() <= 0) continue;

                int hetHanTuLo = Math.min(conHetHan, batch.getSoDiemConLai());

                lichSuDiemRepository.save(LichSuDiem.builder()
                        .nguoiDung(nguoiDungRepository.findById(maNguoiDung).orElse(null))
                        .loaiGiaoDich("HET_HAN")
                        .soDiem(-hetHanTuLo)
                        .lichSuGoc(batch)
                        .thoiGian(LocalDateTime.now())
                        .build());

                batch.setSoDiemConLai(batch.getSoDiemConLai() - hetHanTuLo);
                lichSuDiemRepository.save(batch);

                conHetHan -= hetHanTuLo;
            }

            viDiem.setSoDiemHienTai(viDiem.getSoDiemHienTai() - thucTeExpired);
            diemTichLuyRepository.save(viDiem);

            log.info("Expired {} points for user {}", thucTeExpired, maNguoiDung);
        }

        log.info("Point expiry job completed. Processed {} users.", grouped.size());
    }
}
