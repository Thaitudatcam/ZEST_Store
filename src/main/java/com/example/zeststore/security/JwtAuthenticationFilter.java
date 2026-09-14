package com.example.zeststore.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String token = getTokenFromRequest(request);

        if (token != null) {
            log.debug("Token found: {}", token.substring(0, Math.min(20, token.length())) + "...");
        } else {
            log.debug("No token in request");
        }

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            log.debug("Token valid, email: {}", email);

            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                log.debug("User loaded: {}, authorities: {}", email, userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                log.debug("Authentication set for: {}", email);
            } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
                // Token hợp lệ về mặt chữ ký nhưng không còn khớp với user hiện tại
                // (ví dụ: email đã được đổi/xóa). Xóa context để request được xử lý
                // là chưa đăng nhập (401) thay vì ném lỗi 500.
                log.debug("User không còn tồn tại với email trong token (có thể do đổi email): {}", email);
                SecurityContextHolder.clearContext();
                // Xóa cookie JWT để trình duyệt không tiếp tục gửi token vô hiệu
                jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwtToken", null);
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
            }
        } else if (StringUtils.hasText(token)) {
            log.debug("Token validation failed");
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> "jwtToken".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
}
