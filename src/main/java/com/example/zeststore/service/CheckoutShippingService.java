package com.example.zeststore.service;

import com.example.zeststore.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CheckoutShippingService {
    private final GhnService ghnService;

    public BigDecimal calculate(Integer districtId, String wardCode, int quantity) {
        if (districtId == null || districtId <= 0 || wardCode == null || wardCode.isBlank())
            throw new BadRequestException("Vui lòng chọn quận/huyện và phường/xã giao hàng hợp lệ");
        if (quantity <= 0) throw new BadRequestException("Số lượng hàng giao không hợp lệ");
        int weight = Math.multiplyExact(quantity, 500);
        Map<String, Object> result = ghnService.calculateFee(2, districtId, wardCode.trim(), weight);
        if (!result.containsKey("error") && result.get("data") instanceof Map<?, ?> data
                && data.get("total") instanceof Number total) {
            BigDecimal fee = new BigDecimal(total.toString());
            if (fee.signum() >= 0) return fee;
        }
        throw new BadRequestException("Không thể tính phí vận chuyển, vui lòng thử lại sau");
    }
}
