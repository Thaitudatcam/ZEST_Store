package com.example.zeststore.repository;

import com.example.zeststore.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DanhMucRepository extends JpaRepository<DanhMuc, Integer> {
    List<DanhMuc> findByDanhMucChaIsNullAndNgayXoaIsNull();

    List<DanhMuc> findByDanhMucCha_MaDanhMucAndNgayXoaIsNull(Integer maDanhMucCha);

    Optional<DanhMuc> findByDuongDanSlugAndNgayXoaIsNull(String slug);

    Optional<DanhMuc> findByMaDanhMucAndNgayXoaIsNull(Integer maDanhMuc);
}
