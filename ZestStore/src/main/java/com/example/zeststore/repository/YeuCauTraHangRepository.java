package com.example.zeststore.repository;

import com.example.zeststore.entity.YeuCauTraHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface YeuCauTraHangRepository extends JpaRepository<YeuCauTraHang, Integer> {
    List<YeuCauTraHang> findByDonHang_MaDonHangOrderByNgayTaoDesc(Integer maDonHang);
    List<YeuCauTraHang> findByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(Integer maNguoiDung);
    List<YeuCauTraHang> findAllByOrderByNgayTaoDesc();
    List<YeuCauTraHang> findByTrangThaiOrderByNgayTaoDesc(Integer trangThai);
    Optional<YeuCauTraHang> findByDonHang_MaDonHangAndTrangThai(Integer maDonHang, Integer trangThai);
    long countByTrangThai(Integer trangThai);
}
