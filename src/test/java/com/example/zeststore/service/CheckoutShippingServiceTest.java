package com.example.zeststore.service;

import com.example.zeststore.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CheckoutShippingServiceTest {
    private final GhnService ghn = mock(GhnService.class);
    private final CheckoutShippingService service = new CheckoutShippingService(ghn);

    @Test void missingDistrictOrWardCannotBecomeFreeShipping() {
        assertThrows(BadRequestException.class, () -> service.calculate(null, "W", 1));
        assertThrows(BadRequestException.class, () -> service.calculate(1, " ", 1));
        verifyNoInteractions(ghn);
    }
    @Test void computesWeightFromActualQuantity() {
        when(ghn.calculateFee(2, 1, "W", 2000)).thenReturn(Map.of("data", Map.of("total", 42000)));
        assertEquals(new BigDecimal("42000"), service.calculate(1, " W ", 4));
    }
    @Test void carrierFailureDoesNotSilentlyBecomeZeroOrFixedPrice() {
        when(ghn.calculateFee(2, 1, "W", 500)).thenReturn(Map.of("error", true));
        assertThrows(BadRequestException.class, () -> service.calculate(1, "W", 1));
    }
}
