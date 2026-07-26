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
@Table(name = "diem_tich_luy")
public class DiemTichLuy {

    @Id
    @Column(name = "ma_nguoi_dung")
    private Integer maNguoiDung;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "ma_nguoi_dung")
    @ToString.Exclude
    private NguoiDung nguoiDung;

    @Column(name = "so_diem_hien_tai", nullable = false)
    @Builder.Default
    private Integer soDiemHienTai = 0;

    @Column(name = "ngay_cap_nhat", nullable = false)
    @Builder.Default
    private LocalDateTime ngayCapNhat = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
