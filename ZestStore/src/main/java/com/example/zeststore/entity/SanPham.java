package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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

    @Column(name = "ma_san_pham_code", length = 20, unique = true)
    private String maSanPhamCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_danh_muc", nullable = false)
    private DanhMuc danhMuc;

    @NotBlank @Size(max = 200)
    @Column(name = "ten_san_pham", nullable = false, length = 200)
    private String tenSanPham;

    @NotBlank @Size(max = 200)
    @Column(name = "slug", nullable = false, length = 200, unique = true)
    private String slug;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @Column(name = "mo_ta_ai", columnDefinition = "NVARCHAR(MAX)")
    private String moTaAi;

    @Column(name = "gia_trung_binh", precision = 18, scale = 2)
    private BigDecimal giaTrungBinh;

    @Column(name = "url_anh_dai_dien", length = 500)
    private String urlAnhDaiDien;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @Transient
    @JsonProperty("tongTonKho")
    @Builder.Default
    private Integer tongTonKho = 0;

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<BienTheSanPham> bienThes;

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

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}