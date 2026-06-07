package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hoi_thoai_chatbot")
public class HoiThoaiChatbot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_hoi_thoai")
    private Integer maHoiThoai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_chatbot", nullable = false)
    private AiChatbot chatbot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung")
    private NguoiDung nguoiDung;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "hoiThoai", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<TinNhanChatbot> tinNhans;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}
