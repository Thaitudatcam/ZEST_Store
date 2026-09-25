package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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

    @NotNull @PositiveOrZero
    @Column(name = "don_gia", nullable = false, precision = 18, scale = 2)
    private BigDecimal donGia;

    @NotNull @Positive
    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @NotNull @PositiveOrZero
    @Column(name = "thanh_tien", nullable = false, precision = 18, scale = 2)
    private BigDecimal thanhTien;

    @org.hibernate.annotations.Nationalized
    @Column(name = "ten_san_pham_snapshot", length = 500)
    private String tenSanPhamSnapshot;
    @Column(name = "ma_san_pham_snapshot", length = 100)
    private String maSanPhamSnapshot;
    @Column(name = "sku_snapshot", length = 255)
    private String skuSnapshot;
    @org.hibernate.annotations.Nationalized
    @Column(name = "bien_the_snapshot", length = 500)
    private String bienTheSnapshot;

    @PrePersist
    protected void captureProduct() {
        if (bienThe == null) return;
        if (bienThe.getSanPham() != null) {
            tenSanPhamSnapshot = bienThe.getSanPham().getTenSanPham();
            maSanPhamSnapshot = bienThe.getSanPham().getMaSanPhamCode();
        }
        skuSnapshot = bienThe.getSku();
        String color = bienThe.getMauSac() == null ? "" : bienThe.getMauSac().getMauSac();
        String size = bienThe.getKichCo() == null ? "" : bienThe.getKichCo().getKichCo();
        bienTheSnapshot = color + (!color.isEmpty() && !size.isEmpty() ? " / " : "") + size;
    }
}
