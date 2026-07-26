package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "dot_phat_hanh")
public class DotPhatHanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_dot")
    private Integer maDot;

    @NotBlank
    @Column(name = "ten_dot", nullable = false, length = 200)
    private String tenDot;

    @Column(name = "kieu_giam_gia", nullable = false, columnDefinition = "TINYINT")
    private Integer kieuGiamGia;

    @NotNull @PositiveOrZero
    @Column(name = "gia_tri_giam", nullable = false, precision = 18, scale = 2)
    private BigDecimal giaTriGiam;

    @PositiveOrZero
    @Column(name = "gia_tri_don_toi_thieu", precision = 18, scale = 2)
    private BigDecimal giaTriDonToiThieu;

    @PositiveOrZero
    @Column(name = "gia_tri_giam_toi_da", precision = 18, scale = 2)
    private BigDecimal giaTriGiamToiDa;

    @PositiveOrZero
    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "da_tao", nullable = false)
    @Builder.Default
    private Integer daTao = 0;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_tao", nullable = false)
    @ToString.Exclude
    private NguoiDung nguoiTao;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.daTao == null) this.daTao = 0;
    }
}
