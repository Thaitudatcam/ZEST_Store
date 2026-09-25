package com.example.zeststore.repository;

import com.example.zeststore.entity.SalesInvoice;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;

public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, Long> {
    Optional<SalesInvoice> findByOrder_MaDonHang(Integer orderId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from SalesInvoice i where i.id = :id")
    Optional<SalesInvoice> lockById(@Param("id") Long id);
    @Query("select i from SalesInvoice i where (:q = '' or lower(i.code) like lower(concat('%', :q, '%')) "
        + "or lower(i.orderCode) like lower(concat('%', :q, '%')) or lower(i.customerName) like lower(concat('%', :q, '%')) "
        + "or lower(i.issuedBy) like lower(concat('%', :q, '%'))) "
        + "and (:status is null or i.status = :status) and (:fromDate is null or i.issuedAt >= :fromDate) "
        + "and (:toDate is null or i.issuedAt < :toDate)")
    Page<SalesInvoice> search(@Param("q") String q, @Param("status") String status,
        @Param("fromDate") LocalDateTime from, @Param("toDate") LocalDateTime to, Pageable pageable);
}
