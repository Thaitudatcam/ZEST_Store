package com.example.zeststore.repository;

import com.example.zeststore.entity.TinNhanHoTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TinNhanHoTroRepository extends JpaRepository<TinNhanHoTro, Integer> {

    List<TinNhanHoTro> findByNguoiDung_MaNguoiDungOrderByNgayTaoAsc(Integer maNguoiDung);

    @Query("SELECT t.nguoiDung.maNguoiDung FROM TinNhanHoTro t GROUP BY t.nguoiDung.maNguoiDung ORDER BY MAX(t.ngayTao) DESC")
    List<Integer> findDistinctUserIdsByOrderByLatestMessageDesc();

    List<TinNhanHoTro> findByNguoiDung_MaNguoiDungAndDaDocFalse(Integer maNguoiDung);

    long countByNguoiDung_MaNguoiDungAndVaiTroAndDaDocFalse(Integer maNguoiDung, String vaiTro);

    @Query("SELECT t.nguoiDung.maNguoiDung, COUNT(t) FROM TinNhanHoTro t WHERE t.vaiTro = 'USER' AND t.daDoc = false GROUP BY t.nguoiDung.maNguoiDung")
    List<Object[]> countUnreadForAdmin();
}
