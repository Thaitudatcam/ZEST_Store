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
@Table(name = "giao_dich_vi")
public class GiaoDichVi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_giao_dich")
    private Integer maGiaoDich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiDung;

    @Column(name = "loai", nullable = false, columnDefinition = "TINYINT")
    private Integer loai;

    @Column(name = "so_tien", nullable = false, precision = 18, scale = 2)
    private BigDecimal soTien;

    @Column(name = "so_du_truoc", nullable = false, precision = 18, scale = 2)
    private BigDecimal soDuTruoc;

    @Column(name = "so_du_sau", nullable = false, precision = 18, scale = 2)
    private BigDecimal soDuSau;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @Column(name = "ma_don_hang")
    private Integer maDonHang;

    @Column(name = "thoi_gian", nullable = false)
    private LocalDateTime thoiGian;

    @PrePersist
    protected void onCreate() {
        if (this.thoiGian == null) this.thoiGian = LocalDateTime.now();
    }
}
