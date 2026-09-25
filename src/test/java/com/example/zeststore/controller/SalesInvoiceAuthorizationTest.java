package com.example.zeststore.controller;

import com.example.zeststore.service.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SalesInvoiceAuthorizationTest {
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean SalesInvoiceService invoices() { return mock(SalesInvoiceService.class); }
        @Bean UserService users() { return mock(UserService.class); }
        @Bean SalesInvoiceController controller(SalesInvoiceService invoices, UserService users) {
            return new SalesInvoiceController(invoices, users);
        }
    }
    AnnotationConfigApplicationContext context;
    SalesInvoiceController controller;
    SalesInvoiceService invoices;
    @BeforeEach void setup() {
        context = new AnnotationConfigApplicationContext(Config.class);
        controller = context.getBean(SalesInvoiceController.class);
        invoices = context.getBean(SalesInvoiceService.class);
    }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); context.close(); }
    void login(String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "test", "unused", AuthorityUtils.createAuthorityList("ROLE_" + role)));
    }
    @Test void customerCannotReadIssuePrintOrVoidInvoices() {
        login("CUSTOMER");
        assertThrows(AccessDeniedException.class, () -> controller.detail(1L));
        assertThrows(AccessDeniedException.class, () -> controller.byOrder(1));
        assertThrows(AccessDeniedException.class, () -> controller.issue(1, null));
        assertThrows(AccessDeniedException.class, () -> controller.print(1L));
        assertThrows(AccessDeniedException.class, () -> controller.voidInvoice(1L, Map.of("reason", "Sai"), null));
        verifyNoInteractions(invoices);
    }
    @Test void staffCanReadAndPrintButCannotVoid() {
        login("STAFF");
        controller.detail(1L); controller.print(1L);
        verify(invoices).detail(1L); verify(invoices).registerPrint(1L);
        assertThrows(AccessDeniedException.class, () -> controller.voidInvoice(1L, Map.of("reason", "Sai"), null));
    }
    @Test void adminVoidUsesAuthenticatedActor() {
        login("ADMIN");
        var auth = SecurityContextHolder.getContext().getAuthentication();
        when(context.getBean(UserService.class).getUserIdFromAuth(auth)).thenReturn(9);
        controller.voidInvoice(1L, Map.of("reason", "Sai thông tin"), auth);
        verify(invoices).voidInvoice(1L, "Sai thông tin", 9);
    }
}
