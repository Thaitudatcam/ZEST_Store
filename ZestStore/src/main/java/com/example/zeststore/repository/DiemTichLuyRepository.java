package com.example.zeststore.repository;

import com.example.zeststore.entity.DiemTichLuy;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiemTichLuyRepository extends JpaRepository<DiemTichLuy, Integer> {

    Optional<DiemTichLuy> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DiemTichLuy d WHERE d.maNguoiDung = :maNguoiDung")
    Optional<DiemTichLuy> findByIdWithLock(@Param("maNguoiDung") Integer maNguoiDung);
}
