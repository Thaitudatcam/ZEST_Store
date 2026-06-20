package com.example.zeststore.repository;

import com.example.zeststore.entity.MucYeuThich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MucYeuThichRepository extends JpaRepository<MucYeuThich, Integer> {

    List<MucYeuThich> findByDanhSachYeuThich_MaDsYeuThich(Integer maDsYeuThich);

    Optional<MucYeuThich> findByDanhSachYeuThich_MaDsYeuThichAndSanPham_MaSanPham(
            Integer maDsYeuThich, Integer maSanPham);

    boolean existsByDanhSachYeuThich_NguoiDung_MaNguoiDungAndSanPham_MaSanPham(
            Integer maNguoiDung, Integer maSanPham);
}
