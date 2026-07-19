package com.example.zeststore.service;

import com.example.zeststore.entity.GiaoDichVi;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.GiaoDichViRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ViService {

    private final NguoiDungRepository nguoiDungRepository;
    private final GiaoDichViRepository giaoDichViRepository;

    public BigDecimal getSoDu(Integer userId) {
        return nguoiDungRepository.findById(userId)
                .map(NguoiDung::getSoDu)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public void napTien(Integer userId, BigDecimal soTien, String moTa, Integer maDonHang) {
        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }
        NguoiDung user = nguoiDungRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        BigDecimal soDuTruoc = user.getSoDu();
        BigDecimal soDuSau = soDuTruoc.add(soTien);
        user.setSoDu(soDuSau);
        nguoiDungRepository.save(user);

        giaoDichViRepository.save(GiaoDichVi.builder()
                .nguoiDung(user)
                .loai(1)
                .soTien(soTien)
                .soDuTruoc(soDuTruoc)
                .soDuSau(soDuSau)
                .moTa(moTa)
                .maDonHang(maDonHang)
                .build());
    }

    @Transactional
    public void truTien(Integer userId, BigDecimal soTien, String moTa, Integer maDonHang) {
        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }
        NguoiDung user = nguoiDungRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        BigDecimal soDuTruoc = user.getSoDu();
        if (soDuTruoc.compareTo(soTien) < 0) {
            throw new BadRequestException("Số dư ví không đủ");
        }
        BigDecimal soDuSau = soDuTruoc.subtract(soTien);
        user.setSoDu(soDuSau);
        nguoiDungRepository.save(user);

        giaoDichViRepository.save(GiaoDichVi.builder()
                .nguoiDung(user)
                .loai(2)
                .soTien(soTien)
                .soDuTruoc(soDuTruoc)
                .soDuSau(soDuSau)
                .moTa(moTa)
                .maDonHang(maDonHang)
                .build());
    }

    public Page<GiaoDichVi> getLichSu(Integer userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "thoiGian"));
        return giaoDichViRepository.findByNguoiDung_MaNguoiDung(userId, pageable);
    }
}
