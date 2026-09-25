package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SalesInvoiceServiceTest {
    SalesInvoiceRepository invoices = mock(SalesInvoiceRepository.class);
    DonHangRepository orders = mock(DonHangRepository.class);
    MucDonHangRepository items = mock(MucDonHangRepository.class);
    ThanhToanRepository payments = mock(ThanhToanRepository.class);
    NguoiDungRepository users = mock(NguoiDungRepository.class);
    SalesInvoiceService service = new SalesInvoiceService(invoices, orders, items, payments, users, new ObjectMapper());

    DonHang order(int status) {
        DonHang order = DonHang.builder().maDonHang(1).maDonHangCode("DH0001")
            .trangThaiDon(status).tongTien(BigDecimal.valueOf(100000)).tenNguoiNhan("Khách gốc").build();
        when(orders.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        return order;
    }
    SalesInvoice issue() {
        order(6);
        when(payments.findByDonHang_MaDonHang(1)).thenReturn(List.of(ThanhToan.builder()
            .trangThaiThanhToan(2).phuongThuc(5).soTien(BigDecimal.valueOf(100000)).build()));
        var variant = BienTheSanPham.builder().sanPham(SanPham.builder().tenSanPham("Tên mới").build()).build();
        var item = MucDonHang.builder().bienThe(variant).soLuong(1).donGia(BigDecimal.valueOf(100000))
            .thanhTien(BigDecimal.valueOf(100000)).build();
        item.setTenSanPhamSnapshot("Áo gốc"); item.setMaSanPhamSnapshot("SP0001");
        item.setSkuSnapshot("SP0001-S"); item.setBienTheSnapshot("Đen / S");
        when(items.findByDonHang_MaDonHang(1)).thenReturn(List.of(item));
        when(invoices.saveAndFlush(any())).thenAnswer(inv -> { SalesInvoice i = inv.getArgument(0); i.setId(1L); return i; });
        return service.issue(1, null);
    }
    @Test void rejectsIncompleteOrder() {
        order(2);
        assertThrows(BadRequestException.class, () -> service.issue(1, null));
        verify(invoices, never()).saveAndFlush(any());
    }
    @Test void rejectsIncompletePayment() {
        order(6);
        when(payments.findByDonHang_MaDonHang(1)).thenReturn(List.of(ThanhToan.builder()
            .trangThaiThanhToan(1).soTien(BigDecimal.valueOf(100000)).build()));
        assertThrows(BadRequestException.class, () -> service.issue(1, null));
        verify(invoices, never()).saveAndFlush(any());
    }
    @Test void storesSnapshotAndPrintDoesNotReadLiveProductOrCustomer() {
        SalesInvoice invoice = issue();
        invoice.getOrder().setTenNguoiNhan("Tên đã sửa");
        when(invoices.findById(1L)).thenReturn(Optional.of(invoice));
        var data = service.detail(1L);
        assertEquals("HD0001", data.get("maHoaDonCode"));
        assertEquals("Hệ thống ZestStore", invoice.getIssuedBy());
        assertEquals("Khách gốc", ((Map<?, ?>)data.get("donHang")).get("tenNguoiNhan"));
        assertEquals("Áo gốc", ((Map<?, ?>)((List<?>)data.get("chiTiet")).get(0)).get("tenSanPham"));
        verify(items, times(1)).findByDonHang_MaDonHang(1);
    }
    @Test void retriesReturnExistingInvoiceEvenIfVoided() {
        SalesInvoice invoice = issue(); invoice.setStatus("VOID");
        when(invoices.findByOrder_MaDonHang(1)).thenReturn(Optional.of(invoice));
        clearInvocations(invoices);
        assertSame(invoice, service.issue(1, null));
        verify(invoices, never()).saveAndFlush(any());
    }
    @Test void reprintingKeepsCodeAndCountsRequests() {
        SalesInvoice invoice = issue();
        when(invoices.lockById(1L)).thenReturn(Optional.of(invoice));
        assertEquals("HD0001", service.registerPrint(1L).get("maHoaDonCode"));
        assertEquals("HD0001", service.registerPrint(1L).get("maHoaDonCode"));
        assertEquals(2, invoice.getPrintCount());
    }
    @Test void voidRecordsReasonAndActorWithoutChangingOrderPaymentOrStock() {
        SalesInvoice invoice = issue();
        when(invoices.lockById(1L)).thenReturn(Optional.of(invoice));
        when(users.findById(7)).thenReturn(Optional.of(NguoiDung.builder().hoTen("Quản lý").build()));
        when(invoices.save(any())).thenAnswer(i -> i.getArgument(0));
        clearInvocations(orders, payments, items);
        service.voidInvoice(1L, " Sai thông tin ", 7);
        assertEquals("VOID", invoice.getStatus()); assertEquals("Sai thông tin", invoice.getVoidReason());
        assertEquals(7, invoice.getVoidedById()); assertNotNull(invoice.getVoidedAt());
        assertEquals(6, invoice.getOrder().getTrangThaiDon());
        verifyNoInteractions(orders, payments, items);
        service.voidInvoice(1L, "Lý do khác", 7);
        assertEquals("Sai thông tin", invoice.getVoidReason());
    }
    @Test void voidRequiresReasonAtMost500Characters() {
        assertThrows(BadRequestException.class, () -> service.voidInvoice(1L, " ", 7));
        assertThrows(BadRequestException.class, () -> service.voidInvoice(1L, "x".repeat(501), 7));
        verifyNoInteractions(invoices);
    }
}
