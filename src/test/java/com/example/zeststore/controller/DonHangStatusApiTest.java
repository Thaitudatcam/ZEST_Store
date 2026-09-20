package com.example.zeststore.controller;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.service.DonHangService;
import com.example.zeststore.service.OrderSseService;
import com.example.zeststore.service.UserService;
import com.example.zeststore.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;

import java.lang.reflect.Method;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DonHangStatusApiTest {

    private final DonHangService donHangService = mock(DonHangService.class);
    private final UserService userService = mock(UserService.class);
    private final OrderSseService orderSseService = mock(OrderSseService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new DonHangController(donHangService, userService, orderSseService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        when(userService.getUserIdFromAuth(any())).thenReturn(99);
        when(donHangService.updateOrderStatus(anyInt(), anyInt(), any(), anyBoolean(), anyInt()))
                .thenReturn(DonHang.builder().maDonHang(123).trangThaiDon(2).build());
    }

    @Test
    void statusUpdateForwardsCustomerVisibilityCheckbox() throws Exception {
        mockMvc.perform(put("/api/orders/admin/123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "trangThai", 2,
                                "ghiChu", "Đơn đã được xác nhận",
                                "thongBaoKhachHang", true))))
                .andExpect(status().isOk());

        verify(donHangService).updateOrderStatus(
                eq(123), eq(2), eq("Đơn đã được xác nhận"), eq(true), eq(99));
    }

    @Test
    void statusUpdateRejectsNoteLongerThan500Characters() throws Exception {
        mockMvc.perform(put("/api/orders/admin/123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "trangThai", 2,
                                "ghiChu", "x".repeat(501),
                                "thongBaoKhachHang", false))))
                .andExpect(status().isBadRequest());

        verify(donHangService, never()).updateOrderStatus(anyInt(), anyInt(), any(), anyBoolean(), anyInt());
    }

    @Test
    void statusUpdateIsRestrictedToAdminAndStaff() throws Exception {
        Method method = DonHangController.class.getMethod(
                "updateStatus", Integer.class,
                com.example.zeststore.dto.request.StatusUpdateRequest.class,
                org.springframework.security.core.Authentication.class);
        PreAuthorize authorization = method.getAnnotation(PreAuthorize.class);

        org.junit.jupiter.api.Assertions.assertNotNull(authorization);
        org.junit.jupiter.api.Assertions.assertEquals("hasAnyRole('ADMIN','STAFF')", authorization.value());
    }
}
