package com.example.zeststore.service;

import com.example.zeststore.dto.request.DiemQuyTacRequest;
import com.example.zeststore.entity.DiemQuyTac;
import com.example.zeststore.repository.DiemQuyTacRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiemQuyTacService {

    private static final int DEFAULT_TI_LE_TICH = 10000;
    private static final int DEFAULT_TI_LE_DOI = 1000;
    private static final int DEFAULT_THOI_HAN_THANG = 12;
    private static final int DEFAULT_DIEM_TOI_THIEU = 10;
    private static final int DEFAULT_GIAM_TOI_DA_PHAN_TRAM = 50;
    private static final boolean DEFAULT_TICH_TIEN_MAT = true;

    private final DiemQuyTacRepository diemQuyTacRepository;

    @Transactional(readOnly = true)
    public DiemQuyTac getRules() {
        List<DiemQuyTac> all = diemQuyTacRepository.findAll();
        if (all.isEmpty()) {
            return DiemQuyTac.builder()
                    .tiLeTich(DEFAULT_TI_LE_TICH)
                    .tiLeDoi(DEFAULT_TI_LE_DOI)
                    .thoiHanThang(DEFAULT_THOI_HAN_THANG)
                    .diemToiThieu(DEFAULT_DIEM_TOI_THIEU)
                    .giamToiDaPhanTram(DEFAULT_GIAM_TOI_DA_PHAN_TRAM)
                    .tichTienMat(DEFAULT_TICH_TIEN_MAT)
                    .build();
        }
        return all.get(0);
    }

    @Transactional
    public DiemQuyTac update(DiemQuyTacRequest request) {
        List<DiemQuyTac> all = diemQuyTacRepository.findAll();
        DiemQuyTac rules = all.isEmpty() ? new DiemQuyTac() : all.get(0);
        rules.setTiLeTich(request.getTiLeTich());
        rules.setTiLeDoi(request.getTiLeDoi());
        rules.setThoiHanThang(request.getThoiHanThang());
        rules.setDiemToiThieu(request.getDiemToiThieu());
        rules.setGiamToiDaPhanTram(request.getGiamToiDaPhanTram());
        rules.setTichTienMat(request.getTichTienMat());
        return diemQuyTacRepository.save(rules);
    }
}
