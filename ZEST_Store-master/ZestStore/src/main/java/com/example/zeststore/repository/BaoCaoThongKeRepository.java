package com.example.zeststore.repository;

import com.example.zeststore.entity.BaoCaoThongKe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BaoCaoThongKeRepository extends JpaRepository<BaoCaoThongKe, Integer> {

    List<BaoCaoThongKe> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);

    @Query("SELECT b FROM BaoCaoThongKe b WHERE b.loaiBaoCao = :loaiBaoCao "
            + "AND b.tuNgay >= :tuNgay AND b.denNgay <= :denNgay")
    List<BaoCaoThongKe> findByLoaiAndDateRange(@Param("loaiBaoCao") String loaiBaoCao,
                                                 @Param("tuNgay") LocalDate tuNgay,
                                                 @Param("denNgay") LocalDate denNgay);
}
