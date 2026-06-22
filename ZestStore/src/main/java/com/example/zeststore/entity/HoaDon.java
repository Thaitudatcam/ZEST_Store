package com.example.zeststore.entity;

import jakarta.persistence.*;
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
@Table(name = "hoa_don")
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_hoa_don")
    private Integer maHoaDon;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang", nullable = false, unique = true)
    private DonHang donHang;

    @Column(name = "ma_hoa_don_code", nullable = false, length = 50, unique = true)
    private String maHoaDonCode;

    @Column(name = "email_khach_hang", nullable = false, length = 150)
    private String emailKhachHang;

    @Column(name = "tong_tien", nullable = false, precision = 18, scale = 0)
    private BigDecimal tongTien;

    @Column(name = "trang_thai_hoa_don", nullable = false, length = 20)
    @Builder.Default
    private String trangThaiHoaDon = "issued";

    @Column(name = "url_pdf_hoa_don", length = 500)
    private String urlPdfHoaDon;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @OneToMany(mappedBy = "hoaDon", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<ChiTietHoaDon> chiTietHoaDons;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThaiHoaDon == null) this.trangThaiHoaDon = "issued";
    }
}
