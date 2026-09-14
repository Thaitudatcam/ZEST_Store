package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "phi_van_chuyen")
public class PhiVanChuyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phi_van_chuyen")
    private Integer maPhiVanChuyen;

    @Column(name = "ten_tinh", nullable = false, length = 100)
    private String tenTinh;

    @Column(name = "phi_van_chuyen", nullable = false, precision = 18, scale = 2)
    private BigDecimal phiVanChuyen;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
