package com.example.zeststore.dto.request;

import jakarta.validation.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class StatusUpdateRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test void validRequest_noErrors() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu("Hop le").thongBaoKhachHang(false).build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void nullTrangThai_fails() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(null).build();
        var errors = validator.validate(req);
        assertTrue(errors.stream().anyMatch(e -> e.getPropertyPath().toString().equals("trangThai")));
    }

    @Test void noteAt500Chars_noErrors() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu("A".repeat(500)).build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void noteAt501Chars_fails() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu("A".repeat(501)).build();
        var errors = validator.validate(req);
        assertTrue(errors.stream().anyMatch(e -> e.getPropertyPath().toString().equals("ghiChu")));
    }

    @Test void noteAt1000Chars_fails() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu("X".repeat(1000)).build();
        var errors = validator.validate(req);
        assertTrue(errors.stream().anyMatch(e -> e.getPropertyPath().toString().equals("ghiChu")));
    }

    @Test void nullNote_noErrors() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu(null).build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void emptyNote_noErrors() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu("").build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void notifyCustomerDefaultFalse() {
        StatusUpdateRequest req = StatusUpdateRequest.builder().trangThai(2).build();
        assertFalse(req.isThongBaoKhachHang());
    }

    @Test void notifyCustomerCanBeSetTrue() {
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).thongBaoKhachHang(true).build();
        assertTrue(req.isThongBaoKhachHang());
    }

    @Test void specialCharactersInNote_noErrors() {
        String note = "Đơn <b>bị</b> trễ & \"nghiêm trọng\" - 100%!";
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu(note).build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void unicodeNote_noErrors() {
        String note = "Ghi chú tiếng Việt: đã giao lúc 14:30, cảm ơn khách hàng!";
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu(note).build();
        assertTrue(validator.validate(req).isEmpty());
    }

    @Test void noteWithNewlines_noErrors() {
        String note = "Line 1\nLine 2\nLine 3";
        StatusUpdateRequest req = StatusUpdateRequest.builder()
                .trangThai(2).ghiChu(note).build();
        assertTrue(validator.validate(req).isEmpty());
    }
}
