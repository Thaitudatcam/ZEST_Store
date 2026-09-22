package com.example.zeststore.service;

import com.example.zeststore.entity.BienTheSanPham;
import com.example.zeststore.entity.GioHang;
import com.example.zeststore.entity.MucGioHang;
import com.example.zeststore.entity.SanPham;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.GioHangRepository;
import com.example.zeststore.repository.MucGioHangRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GioHangQuantityTest {

    @Mock private GioHangRepository gioHangRepository;
    @Mock private MucGioHangRepository mucGioHangRepository;
    @Mock private BienTheSanPhamRepository bienTheRepository;
    @Mock private NguoiDungRepository nguoiDungRepository;
    @Mock private CampaignDiscountService campaignDiscountService;
    @Mock private InventoryService inventoryService;

    private GioHangService service;
    private GioHang cart;
    private BienTheSanPham variant;

    @BeforeEach
    void setUp() {
        service = new GioHangService(gioHangRepository, mucGioHangRepository, bienTheRepository,
                nguoiDungRepository, campaignDiscountService, inventoryService);
        cart = GioHang.builder().maGioHang(1).build();
        SanPham product = SanPham.builder().maSanPham(1).trangThai(1).build();
        variant = BienTheSanPham.builder()
                .maBienThe(11)
                .sanPham(product)
                .trangThai(1)
                .tonKho(10)
                .build();

        when(gioHangRepository.findByNguoiDung_MaNguoiDung(7)).thenReturn(Optional.of(cart));
        when(bienTheRepository.findById(11)).thenReturn(Optional.of(variant));
        when(inventoryService.reserved(11, null, null)).thenReturn(0);
    }

    @Test
    void allowsAddingMoreThanFiveWhenStockIsAvailable() {
        when(mucGioHangRepository.findByGioHang_MaGioHangAndBienThe_MaBienThe(1, 11))
                .thenReturn(Optional.empty());

        service.addItem(7, 11, 6);

        ArgumentCaptor<MucGioHang> item = ArgumentCaptor.forClass(MucGioHang.class);
        verify(mucGioHangRepository).save(item.capture());
        assertEquals(6, item.getValue().getSoLuong());
    }

    @Test
    void existingQuantityCanGrowPastFiveUpToAvailableStock() {
        MucGioHang existing = MucGioHang.builder()
                .gioHang(cart)
                .bienThe(variant)
                .soLuong(4)
                .build();
        when(mucGioHangRepository.findByGioHang_MaGioHangAndBienThe_MaBienThe(1, 11))
                .thenReturn(Optional.of(existing));
        when(mucGioHangRepository.save(any(MucGioHang.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.addItem(7, 11, 3);

        assertEquals(7, existing.getSoLuong());
    }
}
