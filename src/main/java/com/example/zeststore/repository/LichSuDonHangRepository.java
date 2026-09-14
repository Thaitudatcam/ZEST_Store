package com.example.zeststore.repository;

import com.example.zeststore.entity.LichSuDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuDonHangRepository extends JpaRepository<LichSuDonHang, Integer> {

    List<LichSuDonHang> findByDonHang_MaDonHangOrderByThoiGianDesc(Integer maDonHang);
}