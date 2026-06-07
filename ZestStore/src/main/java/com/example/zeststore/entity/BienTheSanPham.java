package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "bien_the_san_pham")
public class BienTheSanPham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_bien_the")
    private Integer maBienThe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_san_pham", nullable = false)
    private SanPham sanPham;

    @Column(name = "sku", nullable = false, length = 100, unique = true)
    private String sku;

    @Column(name = "kich_co", nullable = false, length = 10)
    private String kichCo;

    @Column(name = "mau_sac", nullable = false, length = 50)
    private String mauSac;

    @Column(name = "gia", nullable = false, precision = 18, scale = 0)
    private BigDecimal gia;

    @Column(name = "url_anh", length = 500)
    private String urlAnh;

    @Column(name = "ton_kho", nullable = false)
    @Builder.Default
    private Integer tonKho = 0;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "bienThe")
    @ToString.Exclude
    private List<MucGioHang> mucGioHangs;

    @OneToMany(mappedBy = "bienThe")
    @ToString.Exclude
    private List<MucDonHang> mucDonHangs;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.tonKho == null) this.tonKho = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
