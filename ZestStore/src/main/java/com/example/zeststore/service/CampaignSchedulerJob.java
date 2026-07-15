package com.example.zeststore.service;

import com.example.zeststore.entity.ChuongTrinhQuaTang;
import com.example.zeststore.entity.LoaiTrigger;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
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
public class CampaignSchedulerJob {

    private final ChuongTrinhQuaTangRepository campaignRepository;
    private final AutoGrantService autoGrantService;

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void processScheduledCampaigns() {
        LocalDateTime now = LocalDateTime.now();
        List<ChuongTrinhQuaTang> due = campaignRepository
                .findByTrangThaiAndLoaiTriggerAndDaChayXongAndNgayBatDauBefore(
                        1, LoaiTrigger.SU_KIEN, false, now);
        for (ChuongTrinhQuaTang c : due) {
            try {
                autoGrantService.launchCampaign(c);
                log.info("Scheduled campaign {} launched", c.getMaChuongTrinh());
            } catch (Exception e) {
                log.error("Failed to launch scheduled campaign {}: {}", c.getMaChuongTrinh(), e.getMessage());
            }
        }
    }
}
