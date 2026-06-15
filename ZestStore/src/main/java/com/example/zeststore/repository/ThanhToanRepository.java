package com.example.zeststore.repository;

import com.example.zeststore.entity.ThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThanhToanRepository extends JpaRepository<ThanhToan, Integer> {

    List<ThanhToan> findByDonHang_MaDonHang(Integer maDonHang);

    Optional<ThanhToan> findByMaGiaoDich(String maGiaoDich);
}