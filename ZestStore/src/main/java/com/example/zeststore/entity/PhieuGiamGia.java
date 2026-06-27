package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "phieu_giam_gia")
public class PhieuGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu_giam_gia")
    private Integer maPhieuGiamGia;

    @Column(name = "ma_code", nullable = false, length = 50, unique = true)
    private String maCode;

    @Column(name = "kieu_giam_gia", nullable = false, columnDefinition = "TINYINT")
    private Integer kieuGiamGia;

    @NotNull @PositiveOrZero
    @Column(name = "gia_tri_giam", nullable = false, precision = 18, scale = 2)
    private BigDecimal giaTriGiam;

    @PositiveOrZero
    @Column(name = "gia_tri_don_toi_thieu", precision = 18, scale = 2)
    private BigDecimal giaTriDonToiThieu;


    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "phieuGiamGia")
    @ToString.Exclude
    @JsonIgnore
    private List<DonHang> donHangs;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = 1;
        if (this.kieuGiamGia == null) this.kieuGiamGia = 1;
    }

    @PositiveOrZero
    @Column(name = "so_luong")
    private Integer soLuong;

    @PositiveOrZero
    @Column(name = "gia_tri_giam_toi_da", precision = 18, scale = 2)
    private BigDecimal giaTriGiamToiDa;
}