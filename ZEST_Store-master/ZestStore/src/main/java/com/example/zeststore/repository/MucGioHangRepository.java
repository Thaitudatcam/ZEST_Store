package com.example.zeststore.repository;

import com.example.zeststore.entity.MucGioHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MucGioHangRepository extends JpaRepository<MucGioHang, Integer> {
    List<MucGioHang> findByGioHang_MaGioHang(Integer maGioHang);

    Optional<MucGioHang> findByGioHang_MaGioHangAndBienThe_MaBienThe(Integer maGioHang, Integer maBienThe);
}
