package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "thuong_hieu")
public class ThuongHieu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thuong_hieu")
    private Integer maThuongHieu;

    @Column(name = "ten_thuong_hieu", nullable = false, length = 100, unique = true)
    private String tenThuongHieu;

    @Column(name = "mo_ta", length = 500)
    private String moTa;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "logo_url", length = 2000)
    private String logoUrl;

    @Column(name = "trang_thai")
    private Integer trangThai;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}