package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;

@Entity @Table(name = "sales_invoice") @Getter @Setter @NoArgsConstructor
public class SalesInvoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false, unique = true)
    @JsonIgnore
    private DonHang order;
    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;
    @org.hibernate.annotations.Nationalized
    private String issuedBy;
    private Integer issuedById;
    @org.hibernate.annotations.Nationalized
    private String customerName;
    private String orderCode;
    private Integer orderType;
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal total;
    @Column(nullable = false, length = 16)
    private String status = "ISSUED";
    private LocalDateTime voidedAt;
    @org.hibernate.annotations.Nationalized
    private String voidedBy;
    private Integer voidedById;
    @org.hibernate.annotations.Nationalized @Column(length = 500)
    private String voidReason;
    @Column(nullable = false)
    private int printCount;
    @Lob @org.hibernate.annotations.Nationalized
    @Column(nullable = false, updatable = false, columnDefinition = "nvarchar(max)") @JsonIgnore
    private String headerSnapshot;
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.PERSIST)
    @OrderBy("id ASC") @JsonIgnore
    private List<SalesInvoiceLine> lines = new ArrayList<>();
    public Integer getOrderId() { return order.getMaDonHang(); }
}
