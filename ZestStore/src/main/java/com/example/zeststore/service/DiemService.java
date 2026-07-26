package com.example.zeststore.service;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DiemService {

    private static final int TI_LE_TICH = 10000;
    private static final int TI_LE_DOI = 1000;
    private static final int THOI_HAN_THANG = 12;

    private final DiemTichLuyRepository diemTichLuyRepository;
    private final LichSuDiemRepository lichSuDiemRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final DonHangRepository donHangRepository;

    @Transactional
    public void tichDiem(Integer maNguoiDung, Integer maDonHang, BigDecimal tongTien) {
        if (maNguoiDung == null || tongTien == null || tongTien.compareTo(BigDecimal.ZERO) <= 0) return;

        int diemTich = tongTien.divide(BigDecimal.valueOf(TI_LE_TICH), RoundingMode.DOWN).intValue();
        if (diemTich <= 0) return;

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new ResourceNotFoundException("User", maNguoiDung));

        DonHang donHang = donHangRepository.findById(maDonHang)
                .orElse(null);

        DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung)
                .orElseGet(() -> diemTichLuyRepository.save(DiemTichLuy.builder()
                        .nguoiDung(nguoiDung)
                        .soDiem(0)
                        .tongTichLuy(0)
                        .tongSuDung(0)
                        .build()));

        int soDuMoi = viDiem.getSoDiem() + diemTich;

        lichSuDiemRepository.save(LichSuDiem.builder()
                .nguoiDung(nguoiDung)
                .loaiGiaoDich(1)
                .soDiem(diemTich)
                .soDuSau(soDuMoi)
                .ngayHetHan(LocalDate.now().plusMonths(THOI_HAN_THANG))
                .donHang(donHang)
                .thoiGian(LocalDateTime.now())
                .build());

        viDiem.setSoDiem(soDuMoi);
        viDiem.setTongTichLuy(viDiem.getTongTichLuy() + diemTich);
        diemTichLuyRepository.save(viDiem);
    }

    public DiemTichLuy getSoDiem(Integer maNguoiDung) {
        return diemTichLuyRepository.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElse(DiemTichLuy.builder()
                        .maNguoiDung(maNguoiDung)
                        .soDiem(0)
                        .tongTichLuy(0)
                        .tongSuDung(0)
                        .build());
    }

    public Page<LichSuDiem> getLichSuDiem(Integer maNguoiDung, Pageable pageable) {
        return lichSuDiemRepository.findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(maNguoiDung, pageable);
    }

    public int tinhTienGiam(Integer soDiem) {
        if (soDiem == null || soDiem <= 0) return 0;
        return soDiem * TI_LE_DOI;
    }

    @Transactional
    public void truDiem(Integer maNguoiDung, Integer diemDung, Integer maDonHang) {
        if (maNguoiDung == null || diemDung == null || diemDung <= 0) return;

        DiemTichLuy viDiem = diemTichLuyRepository.findByIdWithLock(maNguoiDung)
                .orElseThrow(() -> new BadRequestException("Tài khoản chưa có điểm tích lũy"));

        if (viDiem.getSoDiem() < diemDung) {
            throw new BadRequestException("Số điểm không đủ. Bạn có " + viDiem.getSoDiem() + " điểm");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new ResourceNotFoundException("User", maNguoiDung));

        DonHang donHang = maDonHang != null ? donHangRepository.findById(maDonHang).orElse(null) : null;

        int soDuMoi = viDiem.getSoDiem() - diemDung;

        lichSuDiemRepository.save(LichSuDiem.builder()
                .nguoiDung(nguoiDung)
                .loaiGiaoDich(2)
                .soDiem(diemDung)
                .soDuSau(soDuMoi)
                .donHang(donHang)
                .thoiGian(LocalDateTime.now())
                .build());

        viDiem.setSoDiem(soDuMoi);
        viDiem.setTongSuDung(viDiem.getTongSuDung() + diemDung);
        diemTichLuyRepository.save(viDiem);
    }
}
