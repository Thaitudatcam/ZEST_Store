package com.example.zeststore.service;

import com.example.zeststore.dto.request.*;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosDraftReservationTest {
    @Mock PosCartRepository posCartRepository;
    @Mock NguoiDungRepository nguoiDungRepository;
    @Mock DonHangRepository donHangRepository;
    @Mock InventoryService inventoryService;
    @InjectMocks PosCartService service;
    final List<PosCartItem> rows = new ArrayList<>();
    final NguoiDung admin = NguoiDung.builder().maNguoiDung(1).build();
    final BienTheSanPham variant = BienTheSanPham.builder().maBienThe(3).tonKho(10).trangThai(1).sku("SP-S")
            .sanPham(SanPham.builder().trangThai(1).build()).build();

    @BeforeEach void setup() {
        lenient().when(nguoiDungRepository.findByIdForUpdate(1)).thenReturn(Optional.of(admin));
        lenient().when(inventoryService.lockVariant(3)).thenReturn(variant);
        lenient().when(posCartRepository.findByAdmin_MaNguoiDung(1)).thenAnswer(i -> List.copyOf(rows));
        lenient().when(posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(eq(1), anyString()))
                .thenAnswer(i -> rows.stream().filter(r -> r.getDraftKey().equals(i.getArgument(1))).toList());
        lenient().when(inventoryService.reserved(eq(3), isNull(), eq(1), anyString())).thenAnswer(i ->
                rows.stream().filter(r -> !r.getDraftKey().equals(i.getArgument(3)))
                        .filter(r -> r.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30))).mapToInt(PosCartItem::getSoLuong).sum());
        lenient().when(posCartRepository.save(any())).thenAnswer(i -> {
            PosCartItem row = i.getArgument(0);
            if (!rows.contains(row)) rows.add(row);
            return row;
        });
        lenient().doAnswer(i -> { rows.remove(i.getArgument(0)); return null; }).when(posCartRepository).delete(any());
        lenient().doAnswer(i -> { rows.removeAll(i.getArgument(0)); return null; }).when(posCartRepository).deleteAll(anyIterable());
    }
    PosDraftRequest request(String key, int qty) {
        return PosDraftRequest.builder().checkoutKey(key).items(qty == 0 ? List.of() : List.of(
                PosOrderRequest.PosItem.builder().maBienThe(3).soLuong(qty).build())).build();
    }
    @Test void addingAndRetryingReserveOnlyOnceWithoutDeductingPhysicalStock() {
        service.replace(1, request("A", 3));
        service.replace(1, request("A", 3));
        assertEquals(1, rows.size());
        assertEquals(3, rows.get(0).getSoLuong());
        assertEquals(10, variant.getTonKho());
    }
    @Test void anotherDraftCannotTakeAlreadyReservedStock() {
        service.replace(1, request("A", 7));
        assertThrows(BadRequestException.class, () -> service.replace(1, request("B", 4)));
        assertEquals(1, rows.size());
        service.replace(1, request("B", 3));
        assertEquals(10, rows.stream().mapToInt(PosCartItem::getSoLuong).sum());
    }
    @Test void reducingAndClosingReleaseOnlyTargetDraft() {
        service.replace(1, request("A", 5));
        service.replace(1, request("B", 3));
        service.replace(1, request("A", 2));
        assertEquals(5, rows.stream().mapToInt(PosCartItem::getSoLuong).sum());
        service.clearCart(1, "A");
        assertEquals("B", rows.get(0).getDraftKey());
        assertEquals(3, rows.get(0).getSoLuong());
    }
    @Test void heartbeatCannotResurrectExpiredHold() {
        service.replace(1, request("A", 3));
        rows.get(0).setNgayTao(LocalDateTime.now().minusMinutes(31));
        assertThrows(BadRequestException.class, () -> service.heartbeat(1, "A"));
        assertEquals(List.of(), service.getCart(1, "A").get("items"));
    }
    @Test void completedDraftCannotReserveAgainAfterReload() {
        when(donHangRepository.findByCheckoutKey("POS:1:A")).thenReturn(Optional.of(DonHang.builder().build()));
        assertThrows(BadRequestException.class, () -> service.replace(1, request("A", 3)));
        verifyNoInteractions(inventoryService);
    }
    @Test void eleventhActiveDraftIsRejectedButCanOpenAfterClosingOne() {
        for (int i = 0; i < 10; i++) service.replace(1, request("D" + i, 1));
        assertThrows(BadRequestException.class, () -> service.replace(1, request("D10", 1)));
        service.clearCart(1, "D0");
        service.replace(1, request("D10", 1));
        assertEquals(10, rows.size());
    }
}
