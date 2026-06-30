package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JsonIgnoreProperties({"bienThes", "danhGias", "mucYeuThichs", "hanhVis"})
    private SanPham sanPham;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_thuong_hieu", nullable = false)
    private ThuongHieu thuongHieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_kich_co", nullable = false)
    private KichCo kichCo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_mau_sac", nullable = false)
    private MauSac mauSac;

    @NotNull @PositiveOrZero
    @Column(name = "gia", nullable = false, precision = 18, scale = 2)
    private BigDecimal gia;

    @PositiveOrZero
    @Column(name = "ton_kho", nullable = false)
    @Builder.Default
    private Integer tonKho = 0;

    @NotBlank @Size(max = 100)
    @Column(name = "sku", nullable = false, length = 100, unique = true)
    private String sku;

    @Column(name = "url_anh", length = 500)
    private String urlAnh;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;

    @PostLoad
    public void ensureVersion() {
        if (version == null) version = 0;
    }

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "bienThe")
    @ToString.Exclude
    @JsonIgnore
    private List<MucGioHang> mucGioHangs;

    @OneToMany(mappedBy = "bienThe")
    @ToString.Exclude
    @JsonIgnore
    private List<MucDonHang> mucDonHangs;

    @OneToMany(mappedBy = "bienThe")
    @ToString.Exclude
    @JsonIgnore
    private List<AnhSanPham> anhs;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.tonKho == null) this.tonKho = 0;
    }
}