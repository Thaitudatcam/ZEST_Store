package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

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

    @Column(name = "so_diem", nullable = false)
    @Builder.Default
    private Integer soDiem = 0;

    @Column(name = "tong_tich_luy", nullable = false)
    @Builder.Default
    private Integer tongTichLuy = 0;

    @Column(name = "tong_su_dung", nullable = false)
    @Builder.Default
    private Integer tongSuDung = 0;
}
