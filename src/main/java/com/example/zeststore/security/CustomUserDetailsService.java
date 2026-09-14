package com.example.zeststore.security;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final NguoiDungRepository nguoiDungRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(username).orElse(null);
        if (nguoiDung == null) {
            String normalized = username.replaceAll("[^0-9]", "");
            if (normalized.startsWith("84") && normalized.length() > 9) {
                normalized = "0" + normalized.substring(2);
            }
            nguoiDung = nguoiDungRepository.findBySoDienThoai(normalized).orElse(null);
        }
        if (nguoiDung == null) {
            throw new UsernameNotFoundException("Không tìm thấy tài khoản với email hoặc số điện thoại: " + username);
        }

        return new User(
                nguoiDung.getEmail(),
                nguoiDung.getMatKhauMaHoa(),
                Integer.valueOf(1).equals(nguoiDung.getTrangThai()),
                true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + nguoiDung.getVaiTro().getTenVaiTro()))
        );
    }
}