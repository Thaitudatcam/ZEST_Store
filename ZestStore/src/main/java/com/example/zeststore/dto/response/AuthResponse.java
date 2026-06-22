package com.example.zeststore.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType;
    private Integer maNguoiDung;
    private String email;
    private String hoTen;
    private String vaiTro;
}
