package com.example.zeststore.repository;

import com.example.zeststore.entity.ThuocTinh;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThuocTinhRepository extends JpaRepository<ThuocTinh, Integer> {
    List<ThuocTinh> findByLoaiThuocTinh(String loaiThuocTinh);
    boolean existsByLoaiThuocTinhAndGiaTri(String loaiThuocTinh, String giaTri);
}
