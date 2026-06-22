package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_chatbot")
public class AiChatbot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chatbot")
    private Integer maChatbot;

    @Column(name = "ten_chatbot", nullable = false, length = 100, unique = true)
    private String tenChatbot;

    @Column(name = "nha_cung_cap_ai", nullable = false, length = 50)
    private String nhaCungCapAi;

    @Column(name = "url_chatbot", nullable = false, length = 500)
    private String urlChatbot;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @OneToMany(mappedBy = "chatbot")
    @ToString.Exclude
    @JsonIgnore
    private List<HoiThoaiChatbot> hoiThoais;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = 1;
    }
}