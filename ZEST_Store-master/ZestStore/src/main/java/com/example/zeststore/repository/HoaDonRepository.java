package com.example.zeststore.repository;

import com.example.zeststore.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {

    Optional<HoaDon> findByMaHoaDonCode(String maHoaDonCode);

    Optional<HoaDon> findByDonHang_MaDonHang(Integer maDonHang);
}
