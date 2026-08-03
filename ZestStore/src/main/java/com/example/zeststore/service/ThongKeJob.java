package com.example.zeststore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThongKeJob {

    private final ThongKeService thongKeService;

    @Scheduled(cron = "0 10 0 * * ?")
    @Transactional
    public void capNhatThongKeHangNgay() {
        LocalDate homQua = LocalDate.now().minusDays(1);
        thongKeService.tinhLaiNgay(homQua);
        log.info("Đã cập nhật thống kê ngày {}", homQua);
    }
}
