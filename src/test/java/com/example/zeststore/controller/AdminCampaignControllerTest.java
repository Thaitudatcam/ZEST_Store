package com.example.zeststore.controller;

import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.repository.SanPhamRepository;
import com.example.zeststore.service.AutoGrantService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class AdminCampaignControllerTest {

    @Mock ChuongTrinhQuaTangRepository campaignRepository;
    @Mock PhieuGiamGiaRepository couponRepository;
    @Mock SanPhamRepository productRepository;
    @Mock BienTheSanPhamRepository variantRepository;
    @Mock AutoGrantService autoGrantService;
    @InjectMocks AdminCampaignController controller;

    @Test
    void rejectsPercentageOverOneHundred() {
        assertThrows(IllegalArgumentException.class, () -> controller.create(Map.of(
                "tenChuongTrinh", "Sai phần trăm",
                "loaiTrigger", 2,
                "kieuGiamGia", 1,
                "giaTriGiam", 101
        )));
    }

    @Test
    void rejectsEndBeforeStart() {
        assertThrows(IllegalArgumentException.class, () -> controller.create(Map.of(
                "tenChuongTrinh", "Sai thời gian",
                "loaiTrigger", 2,
                "kieuGiamGia", 1,
                "giaTriGiam", 10,
                "ngayBatDau", "2026-09-23T10:00:00",
                "ngayKetThuc", "2026-09-23T09:00:00"
        )));
    }
}
