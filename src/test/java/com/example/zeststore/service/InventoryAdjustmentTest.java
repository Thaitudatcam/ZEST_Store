package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.dto.request.BienTheRequest;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class InventoryAdjustmentTest {
    @Test void staleFormCannotResetQuantitySoldSinceOpeningForm() {
        InventoryService inventory=mock(InventoryService.class);
        // Only dependencies exercised before rejecting the stale version are needed.
        SanPhamService service=mock(SanPhamService.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service,"inventoryService",inventory);
        BienTheSanPham variant=BienTheSanPham.builder().maBienThe(1).tonKho(8).version(2).build();
        when(inventory.lockVariant(1)).thenReturn(variant);
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> service.updateVariant(1,
                BienTheRequest.builder().tonKho(10).version(1).build()));
        assertEquals(8,variant.getTonKho());
    }
    @Test void adjustmentCannotRemoveStockPromisedToOrders() {
        InventoryService inventory=mock(InventoryService.class);
        SanPhamService service=mock(SanPhamService.class,CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service,"inventoryService",inventory);
        BienTheSanPham variant=BienTheSanPham.builder().maBienThe(1).tonKho(8).version(2).build();
        when(inventory.lockVariant(1)).thenReturn(variant);
        when(inventory.reserved(1,null,null)).thenReturn(6);
        assertThrows(BadRequestException.class, () -> service.updateVariant(1,
                BienTheRequest.builder().tonKho(5).version(2).build()));
        assertEquals(8,variant.getTonKho());
    }
    @Test void heartbeatRenewsActiveHoldsButNeverResurrectsExpiredHolds() {
        PosCartRepository carts=mock(PosCartRepository.class);
        NguoiDungRepository users=mock(NguoiDungRepository.class);
        PosCartService service=new PosCartService(carts,mock(BienTheSanPhamRepository.class),users,mock(InventoryService.class));
        LocalDateTime expiredAt=LocalDateTime.now().minusHours(1);
        PosCartItem expired=PosCartItem.builder().ngayTao(expiredAt).build();
        PosCartItem active=PosCartItem.builder().ngayTao(LocalDateTime.now().minusMinutes(20)).build();
        when(carts.findByAdmin_MaNguoiDung(7)).thenReturn(List.of(active,expired));
        service.heartbeat(7);
        assertEquals(expiredAt,expired.getNgayTao());
        assertTrue(active.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(1)));
    }
}
