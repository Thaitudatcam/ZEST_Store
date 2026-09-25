package com.example.zeststore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentConfig {
    private VnpayConfig vnpay = new VnpayConfig();
    private ZalopayConfig zalopay = new ZalopayConfig();
    private VietQrConfig vietqr = new VietQrConfig();
    private String redirectBaseUrl = "http://localhost:5173";

    // Ngrok support for local development callbacks
    private String ngrokUrl;

    public String getZalopayCallbackUrl() {
        if (ngrokUrl != null && !ngrokUrl.isBlank()) {
            return ngrokUrl + "/api/payments/zalopay/callback";
        }
        return zalopay.getCallbackUrl();
    }

    public String getVnpayReturnUrl() {
        if (ngrokUrl != null && !ngrokUrl.isBlank()) {
            return ngrokUrl + "/api/payments/vnpay/return";
        }
        return vnpay.getReturnUrl();
    }

    public String getZalopayReturnUrl() {
        if (zalopay.getReturnUrl() != null && !zalopay.getReturnUrl().isBlank()) {
            return zalopay.getReturnUrl().trim();
        }
        if (ngrokUrl != null && !ngrokUrl.isBlank()) {
            return ngrokUrl.replaceAll("/+$", "") + "/api/payments/zalopay/return";
        }
        return "http://localhost:8080/api/payments/zalopay/return";
    }

    @Getter
    @Setter
    public static class VietQrConfig {
        private String bankBin;
        private String bankNumber;
        private String bankName;
        private String template = "compact";
    }

    @Getter
    @Setter
    public static class VnpayConfig {
        private String tmnCode;
        private String hashSecret;
        private String url;
        private String returnUrl;
    }

    @Getter
    @Setter
    public static class ZalopayConfig {
        private int appId;
        private String key1;
        private String key2;
        private String endpoint;
        private String queryEndpoint;
        private String callbackUrl;
        private String returnUrl;
    }
}
