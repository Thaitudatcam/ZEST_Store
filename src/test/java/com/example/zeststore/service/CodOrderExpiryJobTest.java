package com.example.zeststore.service;

import com.example.zeststore.repository.DonHangRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class CodOrderExpiryJobTest {

    @Test
    void findsOrdersOlderThanConfiguredDeadlineAndContinuesAfterOneFailure() {
        DonHangRepository orders = mock(DonHangRepository.class);
        DonHangService orderService = mock(DonHangService.class);
        CodOrderExpiryJob job = new CodOrderExpiryJob(orders, orderService, 24);
        when(orders.findExpiredPendingCodOrderIds(any())).thenReturn(List.of(10, 11));
        when(orderService.autoCancelExpiredCodOrder(eq(10), any()))
                .thenThrow(new IllegalStateException("locked"));
        when(orderService.autoCancelExpiredCodOrder(eq(11), any())).thenReturn(true);

        LocalDateTime before = LocalDateTime.now().minusHours(24).minusSeconds(1);
        job.autoCancelExpiredCodOrders();
        LocalDateTime after = LocalDateTime.now().minusHours(24).plusSeconds(1);

        ArgumentCaptor<LocalDateTime> threshold = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(orders).findExpiredPendingCodOrderIds(threshold.capture());
        assertTrue(!threshold.getValue().isBefore(before) && !threshold.getValue().isAfter(after));
        verify(orderService).autoCancelExpiredCodOrder(eq(11), eq(threshold.getValue()));
    }

    @Test
    void rejectsInvalidDeadlineConfiguration() {
        assertThrows(IllegalArgumentException.class,
                () -> new CodOrderExpiryJob(mock(DonHangRepository.class), mock(DonHangService.class), 0));
    }
}
