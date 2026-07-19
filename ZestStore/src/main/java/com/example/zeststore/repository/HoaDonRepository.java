package com.example.zeststore.repository;

import com.example.zeststore.entity.HoaDon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {

    Optional<HoaDon> findByMaHoaDonCode(String maHoaDonCode);

    Optional<HoaDon> findByDonHang_MaDonHang(Integer maDonHang);

    @Query("SELECT h FROM HoaDon h JOIN h.donHang d " +
           "WHERE (:loaiDonHang IS NULL OR d.loaiDonHang = :loaiDonHang) " +
           "AND (:tuNgay IS NULL OR h.ngayTao >= :tuNgay) " +
           "AND (:denNgay IS NULL OR h.ngayTao < :denNgay)")
    Page<HoaDon> findAllFiltered(@Param("loaiDonHang") Integer loaiDonHang,
                                 @Param("tuNgay") LocalDateTime tuNgay,
                                 @Param("denNgay") LocalDateTime denNgay,
                                 Pageable pageable);
}
