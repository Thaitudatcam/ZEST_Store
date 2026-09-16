package com.example.zeststore.repository;

import com.example.zeststore.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {

    List<ThongBao> findByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(Integer maNguoiDung);

    long countByNguoiDung_MaNguoiDungAndDaDocFalse(Integer maNguoiDung);

    /** Bulk mark all unread notifications of a user as read in a single UPDATE. */
    @Modifying
    @Query("UPDATE ThongBao t SET t.daDoc = true WHERE t.nguoiDung.maNguoiDung = :maNguoiDung AND t.daDoc = false")
    int markAllRead(@Param("maNguoiDung") Integer maNguoiDung);

    /** Delete all notifications for a user. */
    @Modifying
    @Query("DELETE FROM ThongBao t WHERE t.nguoiDung.maNguoiDung = :maNguoiDung")
    int deleteAllByUser(@Param("maNguoiDung") Integer maNguoiDung);
}