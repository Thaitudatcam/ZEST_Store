package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("paymentAccess")
@RequiredArgsConstructor
public class PaymentAccess {
    private final DonHangRepository orders;
    private final ThanhToanRepository payments;
    private final UserService users;

    private boolean canRead(DonHang order, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || order == null) return false;
        if (auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"))) return true;
        return order.getNguoiDung() != null && order.getNguoiDung().getMaNguoiDung()
                .equals(users.getUserIdFromAuth(auth));
    }

    public boolean canReadOrder(Integer id, Authentication auth) {
        return orders.findById(id).map(order -> canRead(order, auth)).orElse(false);
    }

    public boolean canReadPayment(Integer id, Authentication auth) {
        return payments.findById(id).map(payment -> canRead(payment.getDonHang(), auth)).orElse(false);
    }
}
