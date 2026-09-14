package com.example.zeststore.repository;

import com.example.zeststore.entity.LoaiTrigger;
import com.example.zeststore.entity.TrangThaiVoucher;
import com.example.zeststore.entity.VoucherNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherNguoiDungRepository extends JpaRepository<VoucherNguoiDung, Integer> {

    List<VoucherNguoiDung> findByNguoiDung_MaNguoiDungOrderByNgayNhanDesc(Integer maNguoiDung);

    List<VoucherNguoiDung> findByNguoiDung_MaNguoiDungAndTrangThai(Integer maNguoiDung, TrangThaiVoucher trangThai);

    long countByNguoiDung_MaNguoiDungAndTrangThai(Integer maNguoiDung, TrangThaiVoucher trangThai);

    Optional<VoucherNguoiDung> findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(
            Integer maNguoiDung, Integer maPhieuGiamGia);

    @Query("SELECT v FROM VoucherNguoiDung v WHERE v.nguoiDung.maNguoiDung = :userId "
            + "AND v.phieuGiamGia.maPhieuGiamGia = :couponId AND v.trangThai IN :statuses")
    Optional<VoucherNguoiDung> findByUserAndCouponAndStatusIn(
            @Param("userId") Integer userId,
            @Param("couponId") Integer couponId,
            @Param("statuses") List<TrangThaiVoucher> statuses);

    @Query("SELECT v FROM VoucherNguoiDung v WHERE v.trangThai = :trangThai "
            + "AND v.ngayHetHan IS NOT NULL AND v.ngayHetHan < :now")
    List<VoucherNguoiDung> findExpiredByStatus(
            @Param("trangThai") TrangThaiVoucher trangThai,
            @Param("now") LocalDateTime now);

    boolean existsByNguoiDung_MaNguoiDungAndChuongTrinhQuaTang_MaChuongTrinh(
            Integer maNguoiDung, Integer maChuongTrinh);

    @Query("SELECT v FROM VoucherNguoiDung v WHERE v.chuongTrinhQuaTang.loaiTrigger = :loaiTrigger "
            + "AND v.nguoiDung.maNguoiDung = :userId")
    List<VoucherNguoiDung> findByUserAndLoaiTrigger(
            @Param("userId") Integer userId,
            @Param("loaiTrigger") LoaiTrigger loaiTrigger);
}
