package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "muc_don_hang")
public class MucDonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_muc_don_hang")
    private Integer maMucDonHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang", nullable = false)
    private DonHang donHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_bien_the", nullable = false)
    private BienTheSanPham bienThe;

    @Column(name = "don_gia", nullable = false, precision = 18, scale = 0)
    private BigDecimal donGia;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "thanh_tien", nullable = false, precision = 18, scale = 0)
    private BigDecimal thanhTien;
}
