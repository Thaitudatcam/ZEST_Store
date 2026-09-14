package com.example.zeststore.repository;

import com.example.zeststore.entity.DiaChiNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiaChiNguoiDungRepository extends JpaRepository<DiaChiNguoiDung, Integer> {
    List<DiaChiNguoiDung> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);

    Optional<DiaChiNguoiDung> findByNguoiDung_MaNguoiDungAndLaMacDinhTrue(Integer maNguoiDung);

    @Modifying
    @Query("UPDATE DiaChiNguoiDung d SET d.laMacDinh = false WHERE d.nguoiDung.maNguoiDung = :maNguoiDung")
    void resetMacDinhByNguoiDungId(@Param("maNguoiDung") Integer maNguoiDung);
}
