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
@Table(name = "thanh_toan")
public class ThanhToan {

    @Column(name = "refunded", nullable = false)
    @Builder.Default
    private Boolean refunded = false;

    @Column(name = "gateway_transaction_id", length = 100)
    private String gatewayTransactionId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thanh_toan")
    private Integer maThanhToan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"thanhToans", "mucDonHangs", "danhGias", "lichSuDonHangs"})
    private DonHang donHang;

    @Column(name = "ma_nguoi_dung")
    private Integer maNguoiDung;

    @Column(name = "phuong_thuc", nullable = false, columnDefinition = "TINYINT")
    private Integer phuongThuc;

    @Column(name = "nha_cung_cap", length = 50)
    private String nhaCungCap;

    @Column(name = "ma_giao_dich", length = 100, unique = true)
    private String maGiaoDich;

    @Column(name = "trang_thai_thanh_toan", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThaiThanhToan = 1;

    @NotNull @PositiveOrZero
    @Column(name = "so_tien", nullable = false, precision = 18, scale = 2)
    private BigDecimal soTien;

    @PastOrPresent
    @Column(name = "thoi_gian_tao", nullable = false)
    private LocalDateTime thoiGianTao;

    @Column(name = "thoi_gian_tt")
    private LocalDateTime thoiGianTt;

    @PrePersist
    protected void onCreate() {
        this.thoiGianTao = LocalDateTime.now();
        if (this.trangThaiThanhToan == null) this.trangThaiThanhToan = 1;
    }
}
