package com.example.zeststore.entity;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class OrderReceiptSnapshotTest {
    @Test
    void productChangesDoNotChangeCapturedReceiptFields() {
        SanPham product = SanPham.builder().tenSanPham("Áo cũ").maSanPhamCode("SP001").build();
        BienTheSanPham variant = BienTheSanPham.builder().sanPham(product).sku("SP001-S").build();
        MucDonHang item = MucDonHang.builder().bienThe(variant).build();
        item.captureProduct();
        product.setTenSanPham("Áo mới");
        product.setMaSanPhamCode("SP002");
        variant.setSku("SP002-M");
        assertEquals("Áo cũ", item.getTenSanPhamSnapshot());
        assertEquals("SP001", item.getMaSanPhamSnapshot());
        assertEquals("SP001-S", item.getSkuSnapshot());
    }

    @Test
    void posCustomerIsNotMisrepresentedAsCreatorWithoutHistory() {
        DonHang order = DonHang.builder().loaiDonHang(2)
                .nguoiDung(NguoiDung.builder().hoTen("Khách mua").build()).build();
        assertEquals("Chưa có thông tin", order.getNguoiTaoTen());
    }
}
