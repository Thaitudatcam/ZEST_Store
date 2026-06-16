package com.example.zeststore.repository;

import com.example.zeststore.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {

    List<ThongBao> findByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(Integer maNguoiDung);

    long countByNguoiDung_MaNguoiDungAndDaDocFalse(Integer maNguoiDung);
}