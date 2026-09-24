package com.example.zeststore.service;

import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductFilterServiceTest {

    @Mock SanPhamRepository sanPhamRepository;
    @Mock BienTheSanPhamRepository bienTheRepository;
    @Mock AnhSanPhamRepository anhSanPhamRepository;
    @Mock DanhMucRepository danhMucRepository;
    @Mock DanhGiaRepository danhGiaRepository;
    @Mock HanhViNguoiDungRepository hanhViRepository;
    @Mock ThuongHieuRepository thuongHieuRepository;
    @Mock KichCoRepository kichCoRepository;
    @Mock MauSacRepository mauSacRepository;
    @Mock MucGioHangRepository mucGioHangRepository;
    @Mock PosCartRepository posCartRepository;
    @Mock ThuocTinhRepository thuocTinhRepository;
    @Mock InventoryService inventoryService;
    @Mock CampaignDiscountService campaignDiscountService;
    @InjectMocks SanPhamService service;

    @Test
    void combinesKeywordCategoryVariantAndPriceFilters() {
        when(sanPhamRepository.filterPublicProducts(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(Page.empty());

        service.getProducts("  thể   thao ", 4, "Zest", "XL", "Cotton",
                new BigDecimal("300000"), new BigDecimal("500000"),
                0, 12, "giaTrungBinh", "asc");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(sanPhamRepository).filterPublicProducts(
                org.mockito.ArgumentMatchers.eq("thể thao"), org.mockito.ArgumentMatchers.eq(4),
                org.mockito.ArgumentMatchers.eq("Zest"), org.mockito.ArgumentMatchers.eq("XL"),
                org.mockito.ArgumentMatchers.eq("Cotton"),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("300000")),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("500000")), pageable.capture());

        assertEquals("giaTrungBinh: ASC,maSanPham: DESC", pageable.getValue().getSort().toString());
        assertEquals(12, pageable.getValue().getPageSize());
    }

    @Test
    void invalidSortPropertyFallsBackToCreationDate() {
        when(sanPhamRepository.filterPublicProducts(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(Page.empty());

        service.getProducts(null, null, null, null, null,
                null, null, 0, 12, "notAProperty", "desc");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(sanPhamRepository).filterPublicProducts(
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(), pageable.capture());
        assertEquals("ngayTao: DESC,maSanPham: DESC", pageable.getValue().getSort().toString());
    }
}
