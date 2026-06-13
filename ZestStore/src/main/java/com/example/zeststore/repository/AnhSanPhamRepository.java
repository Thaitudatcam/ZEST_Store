package com.example.zeststore.repository;

import com.example.zeststore.entity.AnhSanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnhSanPhamRepository extends JpaRepository<AnhSanPham, Integer> {

    List<AnhSanPham> findBySanPham_MaSanPhamAndNgayXoaIsNull(Integer maSanPham);

    Optional<AnhSanPham> findBySanPham_MaSanPhamAndLaAnhChinhTrueAndNgayXoaIsNull(Integer maSanPham);
}
