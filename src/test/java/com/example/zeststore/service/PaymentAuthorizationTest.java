package com.example.zeststore.service;

import com.example.zeststore.controller.VietQrController;
import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentAuthorizationTest {
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean VietQrService service() { return mock(VietQrService.class); }
        @Bean VietQrController controller(VietQrService service) { return new VietQrController(service); }
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void customerCannotMarkAnyQrPaymentAsPaid() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                    "customer", "", AuthorityUtils.createAuthorityList("ROLE_CUSTOMER")));
            assertThrows(AccessDeniedException.class, () -> context.getBean(VietQrController.class).confirmPayment(1));
            verifyNoInteractions(context.getBean(VietQrService.class));
        }
    }
    @Test void employeeCanConfirmAReceivedTransfer() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                    "staff", "", AuthorityUtils.createAuthorityList("ROLE_STAFF")));
            context.getBean(VietQrController.class).confirmPayment(1);
            verify(context.getBean(VietQrService.class)).confirmPayment(1);
        }
    }
    @Test void paymentReadIsRestrictedToOwnerOrStaff() {
        var orders = mock(DonHangRepository.class); var payments = mock(ThanhToanRepository.class);
        var users = mock(UserService.class); var access = new PaymentAccess(orders, payments, users);
        var order = DonHang.builder().nguoiDung(NguoiDung.builder().maNguoiDung(10).build()).build();
        when(payments.findById(5)).thenReturn(Optional.of(ThanhToan.builder().donHang(order).build()));
        var auth = new UsernamePasswordAuthenticationToken("other", "", AuthorityUtils.createAuthorityList("ROLE_CUSTOMER"));
        when(users.getUserIdFromAuth(auth)).thenReturn(11);
        assertFalse(access.canReadPayment(5, auth));
        when(users.getUserIdFromAuth(auth)).thenReturn(10);
        assertTrue(access.canReadPayment(5, auth));
        var staff = new UsernamePasswordAuthenticationToken("staff", "", AuthorityUtils.createAuthorityList("ROLE_STAFF"));
        assertTrue(access.canReadPayment(5, staff));
    }
}
