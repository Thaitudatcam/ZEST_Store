package com.example.zeststore.service;

import com.example.zeststore.entity.DiemQuyTac;
import com.example.zeststore.entity.DiemTichLuy;
import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.LichSuDiem;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.DiemTichLuyRepository;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.LichSuDiemRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiemService {

    private static final int TI_LE_TICH_DEFAULT = 10000;
    private static final int TI_LE_DOI_DEFAULT = 1000;
    private static final int THOI_HAN_THANG_DEFAULT = 12;

    private final DiemTichLuyRepository diemTichLuyRepository;
    private final LichSuDiemRepository lichSuDiemRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final DonHangRepository donHangRepository;
    private final DiemQuyTacService diemQuyTacService;

    private int tiLeTich() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getTiLeTich() != null ? r.getTiLeTich() : 10000;
    }

    private int tiLeDoi() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getTiLeDoi() != null ? r.getTiLeDoi() : 1000;
    }

    private int thoiHanThang() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getThoiHanThang() != null ? r.getThoiHanThang() : 12;
    }

    public int diemToiThieu() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getDiemToiThieu() != null ? r.getDiemToiThieu() : 10;
    }

    public int giamToiDaPhanTram() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getGiamToiDaPhanTram() != null ? r.getGiamToiDaPhanTram() : 50;
    }

    public boolean tichTienTrenTienMat() {
        DiemQuyTac r = diemQuyTacService.getRules();
        return r.getTichTienMat() == null || r.getTichTienMat();
    }

    @Transactional
    public void tichDiem(Integer maNguoiDung, Integer maDonHang, BigDecimal tongTien, String maKenh) {
        if (maNguoiDung == null || tongTien == null || tongTien.compareTo(BigDecimal.ZERO) <= 0) return;

        int diemTich = tongTien.divide(BigDecimal.valueOf(tiLeTich()), RoundingMode.DOWN).intValue();
        if (diemTich <= 0) return;

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new ResourceNotFoundException("User", maNguoiDung));

        DonHang donHang = maDonHang != null ? donHangRepository.findById(maDonHang).orElse(null) : null;

        DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung)
                .orElseGet(() -> diemTichLuyRepository.save(DiemTichLuy.builder()
                        .nguoiDung(nguoiDung)
                        .soDiemHienTai(0)
                        .build()));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime ngayHetHan = now.plusMonths(thoiHanThang());

        lichSuDiemRepository.save(LichSuDiem.builder()
                .nguoiDung(nguoiDung)
                .loaiGiaoDich("TICH_LUY")
                .soDiem(diemTich)
                .soDiemConLai(diemTich)
                .donHang(donHang)
                .maKenh(maKenh)
                .ngayTich(now)
                .ngayHetHan(ngayHetHan)
                .thoiGian(now)
                .build());

        viDiem.setSoDiemHienTai(viDiem.getSoDiemHienTai() + diemTich);
        diemTichLuyRepository.save(viDiem);
    }

    public DiemTichLuy getSoDiem(Integer maNguoiDung) {
        return diemTichLuyRepository.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElse(DiemTichLuy.builder()
                        .maNguoiDung(maNguoiDung)
                        .soDiemHienTai(0)
                        .build());
    }

    public Page<LichSuDiem> getLichSuDiem(Integer maNguoiDung, Pageable pageable) {
        return lichSuDiemRepository.findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(maNguoiDung, pageable);
    }

    public int getTongTichLuy(Integer maNguoiDung) {
        Integer sum = lichSuDiemRepository.sumTichLuy(maNguoiDung);
        return sum != null ? sum : 0;
    }

    public int getTongSuDung(Integer maNguoiDung) {
        Integer sum = lichSuDiemRepository.sumSuDung(maNguoiDung);
        return sum != null ? Math.abs(sum) : 0;
    }

    public int tinhTienGiam(Integer soDiem) {
        if (soDiem == null || soDiem <= 0) return 0;
        return soDiem * tiLeDoi();
    }

    public int maxDiemChoPhep(BigDecimal giaTriHang) {
        if (giaTriHang == null || giaTriHang.compareTo(BigDecimal.ZERO) <= 0) return 0;
        BigDecimal maxGiam = giaTriHang
                .multiply(BigDecimal.valueOf(giamToiDaPhanTram()))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
        return maxGiam.divide(BigDecimal.valueOf(tiLeDoi()), 0, RoundingMode.DOWN).intValue();
    }

    @Transactional
    public void truDiem(Integer maNguoiDung, Integer diemDung, Integer maDonHang, String maKenh) {
        if (maNguoiDung == null || diemDung == null || diemDung <= 0) return;

        DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung)
                .orElseThrow(() -> new BadRequestException("Tài khoản chưa có điểm tích lũy"));

        if (viDiem.getSoDiemHienTai() < diemDung) {
            throw new BadRequestException("Số điểm không đủ. Bạn có " + viDiem.getSoDiemHienTai() + " điểm");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new ResourceNotFoundException("User", maNguoiDung));

        DonHang donHang = maDonHang != null ? donHangRepository.findById(maDonHang).orElse(null) : null;

        LocalDateTime now = LocalDateTime.now();

        List<LichSuDiem> batches = lichSuDiemRepository.findAvailableBatchesFifo(maNguoiDung);

        int conPhaiTru = diemDung;
        for (LichSuDiem batch : batches) {
            if (conPhaiTru <= 0) break;
            if (batch.getSoDiemConLai() == null || batch.getSoDiemConLai() <= 0) continue;

            int truTuLo = Math.min(conPhaiTru, batch.getSoDiemConLai());

            lichSuDiemRepository.save(LichSuDiem.builder()
                    .nguoiDung(nguoiDung)
                    .loaiGiaoDich("SU_DUNG")
                    .soDiem(-truTuLo)
                    .lichSuGoc(batch)
                    .donHang(donHang)
                    .maKenh(maKenh)
                    .thoiGian(now)
                    .build());

            batch.setSoDiemConLai(batch.getSoDiemConLai() - truTuLo);
            lichSuDiemRepository.save(batch);

            conPhaiTru -= truTuLo;
        }

        viDiem.setSoDiemHienTai(viDiem.getSoDiemHienTai() - diemDung);
        diemTichLuyRepository.save(viDiem);
    }
}
