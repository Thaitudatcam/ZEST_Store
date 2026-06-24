package com.example.zeststore.repository;

import com.example.zeststore.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Integer> {
    Optional<NguoiDung> findByEmail(String email);

    Optional<NguoiDung> findBySoDienThoai(String soDienThoai);

    boolean existsByEmail(String email);

    boolean existsBySoDienThoai(String soDienThoai);

    @Query("SELECT u FROM NguoiDung u WHERE u.vaiTro.tenVaiTro = 'CUSTOMER' AND u.trangThai = 1 AND (LOWER(u.hoTen) LIKE LOWER(CONCAT('%', :q, '%')) OR u.soDienThoai LIKE CONCAT('%', :q, '%'))")
    List<NguoiDung> searchCustomers(@Param("q") String query);
}
