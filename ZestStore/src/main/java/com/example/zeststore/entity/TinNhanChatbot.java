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
@Table(name = "tin_nhan_chatbot")
public class TinNhanChatbot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_tin_nhan")
    private Integer maTinNhan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_hoi_thoai", nullable = false)
    private HoiThoaiChatbot hoiThoai;

    @Column(name = "vai_tro_gui", nullable = false, length = 20)
    private String vaiTroGui;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String noiDung;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}