package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "san_pham")
public class SanPham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_san_pham")
    private Integer maSanPham;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_danh_muc", nullable = false)
    private DanhMuc danhMuc;

    @Column(name = "ten_san_pham", nullable = false, length = 200)
    private String tenSanPham;

    @Column(name = "slug", nullable = false, length = 200, unique = true)
    private String slug;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @Column(name = "mo_ta_ai", columnDefinition = "NVARCHAR(MAX)")
    private String moTaAi;

    @Column(name = "gia", nullable = false, precision = 18, scale = 0)
    private BigDecimal gia;

    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "active";

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<BienTheSanPham> bienThes;

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<AnhSanPham> anhs;

    @OneToMany(mappedBy = "sanPham")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

    @OneToMany(mappedBy = "sanPham")
    @ToString.Exclude
    @JsonIgnore
    private List<MucYeuThich> mucYeuThichs;

    @OneToMany(mappedBy = "sanPham")
    @ToString.Exclude
    @JsonIgnore
    private List<HanhViNguoiDung> hanhVis;

    @Transient
    @JsonProperty("anhChinh")
    public String getAnhChinh() {
        if (anhs != null) {
            return anhs.stream()
                .filter(a -> a.getNgayXoa() == null)
                .filter(AnhSanPham::getLaAnhChinh)
                .findFirst()
                .map(AnhSanPham::getUrlAnh)
                .orElse(anhs.stream()
                    .filter(a -> a.getNgayXoa() == null)
                    .findFirst()
                    .map(AnhSanPham::getUrlAnh)
                    .orElse(null));
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = "active";
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
