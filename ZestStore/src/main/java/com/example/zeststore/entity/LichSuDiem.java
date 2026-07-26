package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "lich_su_diem")
public class LichSuDiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_giao_dich")
    private Integer maGiaoDich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    @ToString.Exclude
    private NguoiDung nguoiDung;

    @Column(name = "loai_giao_dich", nullable = false, columnDefinition = "TINYINT")
    private Integer loaiGiaoDich;

    @Column(name = "so_diem", nullable = false)
    private Integer soDiem;

    @Column(name = "so_du_sau", nullable = false)
    private Integer soDuSau;

    @Column(name = "ngay_het_han")
    private LocalDate ngayHetHan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang")
    @ToString.Exclude
    private DonHang donHang;

    @Column(name = "thoi_gian", nullable = false)
    @Builder.Default
    private LocalDateTime thoiGian = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.thoiGian == null) this.thoiGian = LocalDateTime.now();
    }
}
