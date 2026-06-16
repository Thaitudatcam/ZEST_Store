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
@Table(name = "chi_tiet_hoa_don")
public class ChiTietHoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chi_tiet_hoa_don")
    private Integer maChiTietHoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoa_don", nullable = false)
    private HoaDon hoaDon;

    @Column(name = "ten_san_pham", nullable = false, length = 200)
    private String tenSanPham;

    @Column(name = "thong_tin_bien_the", nullable = false, length = 200)
    private String thongTinBienThe;

    @Column(name = "don_gia", nullable = false, precision = 18, scale = 0)
    private BigDecimal donGia;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "thanh_tien", nullable = false, precision = 18, scale = 0)
    private BigDecimal thanhTien;
}
