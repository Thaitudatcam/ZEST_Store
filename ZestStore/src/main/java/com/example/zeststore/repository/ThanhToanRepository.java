package com.example.zeststore.repository;

import com.example.zeststore.entity.ThanhToan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ThanhToanRepository extends JpaRepository<ThanhToan, Integer> {

    List<ThanhToan> findByDonHang_MaDonHang(Integer maDonHang);

    Optional<ThanhToan> findByMaGiaoDich(String maGiaoDich);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM ThanhToan t WHERE t.maThanhToan = :id")
    Optional<ThanhToan> findByIdForUpdate(@Param("id") Integer id);

    Optional<ThanhToan> findByMaGiaoDichAndTrangThaiThanhToan(String maGiaoDich, Integer trangThaiThanhToan);

    Optional<ThanhToan> findByDonHang_MaDonHangAndTrangThaiThanhToan(Integer maDonHang, Integer trangThaiThanhToan);

    List<ThanhToan> findByTrangThaiThanhToanAndThoiGianTaoBefore(Integer trangThai, LocalDateTime thoiGian);
}