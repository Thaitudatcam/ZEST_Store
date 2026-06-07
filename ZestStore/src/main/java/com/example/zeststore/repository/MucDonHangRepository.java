package com.example.zeststore.repository;

import com.example.zeststore.entity.MucDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MucDonHangRepository extends JpaRepository<MucDonHang, Integer> {
    List<MucDonHang> findByDonHang_MaDonHang(Integer maDonHang);
}
