package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;

@Entity @Table(name = "sales_invoice_line") @Getter @Setter @NoArgsConstructor
public class SalesInvoiceLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "invoice_id", nullable = false) @JsonIgnore
    private SalesInvoice invoice;
    private String productCode;
    private String sku;
    @org.hibernate.annotations.Nationalized @Column(length = 500) private String productName;
    @org.hibernate.annotations.Nationalized @Column(length = 500) private String variantName;
    @Column(nullable = false) private Integer quantity;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal unitPrice;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
}
