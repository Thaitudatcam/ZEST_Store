package com.example.zeststore.repository;

import com.example.zeststore.entity.VoucherNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherNguoiDungRepository extends JpaRepository<VoucherNguoiDung, Integer> {

    List<VoucherNguoiDung> findByNguoiDung_MaNguoiDungOrderByNgayNhanDesc(Integer maNguoiDung);

    List<VoucherNguoiDung> findByNguoiDung_MaNguoiDungAndTrangThai(Integer maNguoiDung, Integer trangThai);

    long countByNguoiDung_MaNguoiDungAndTrangThai(Integer maNguoiDung, Integer trangThai);

    Optional<VoucherNguoiDung> findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(
            Integer maNguoiDung, Integer maPhieuGiamGia);
}
