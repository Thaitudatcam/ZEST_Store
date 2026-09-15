package com.example.zeststore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    @JsonIgnore
    @Column(name = "url_anh_dai_dien", length = 500)
    private String urlAnhDaiDien;

    @Size(max = 100)
    @Column(name = "xuat_xu", length = 100)
    private String xuatXu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_loai_ao")
    private ThuocTinh loaiAo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_kieu_dang")
    private ThuocTinh kieuDang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_chat_lieu")
    private ThuocTinh chatLieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_co_ao")
    private ThuocTinh coAo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_tay_ao")
    private ThuocTinh tayAo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_vai_ao")
    private ThuocTinh vaiAo;

    @JsonProperty("urlAnhDaiDien")
    public String getUrlAnhDaiDien() {
        if (urlAnhDaiDien != null) return urlAnhDaiDien;
        if (bienThes != null && !bienThes.isEmpty()) {
            return bienThes.get(0).getUrlAnh();
        }
        return null;
    }

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
    @JsonProperty("tenThuongHieu")
    private String tenThuongHieu;

    @Transient
    @JsonProperty("tongTonKho")
    @Builder.Default
    private Integer tongTonKho = 0;

    @Transient
    @JsonProperty("tongGiaTri")
    @Builder.Default
    private BigDecimal tongGiaTri = BigDecimal.ZERO;

    @Transient
    @JsonProperty("giaThapNhat")
    private BigDecimal giaThapNhat;

    @Transient
    @JsonProperty("averageRating")
    private Double averageRating;

    // % giảm giá từ chương trình đang chạy (do CampaignDiscountService gán khi trả về cho shop)
    @Transient
    @JsonProperty("phanTramGiamGia")
    private BigDecimal phanTramGiamGia;

    @Transient
    @JsonProperty("reviewCount")
    private Long reviewCount;

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnoreProperties({"sanPham", "mucGioHangs", "mucDonHangs", "anhs"})
    private List<BienTheSanPham> bienThes;

    @OneToMany(mappedBy = "sanPham")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

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