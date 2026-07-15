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
@Table(name = "coupon_usage_log")
public class CouponUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_code", nullable = false, length = 50)
    private String maCode;

    @Column(name = "ma_nguoi_dung")
    private Integer maNguoiDung;

    @Column(name = "ma_don_hang")
    private Integer maDonHang;

    @Column(name = "so_tien_giam", precision = 18, scale = 2)
    private BigDecimal soTienGiam;

    @Column(name = "thoi_gian", nullable = false)
    private LocalDateTime thoiGian;

    @Column(name = "loai", length = 20)
    @Builder.Default
    private String loai = "ONLINE";

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @PrePersist
    protected void onCreate() {
        if (thoiGian == null) thoiGian = LocalDateTime.now();
    }
}
