package com.example.zeststore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentConfig {
    private VnpayConfig vnpay = new VnpayConfig();
    private MomoConfig momo = new MomoConfig();
    private ZalopayConfig zalopay = new ZalopayConfig();
    private VietQrConfig vietqr = new VietQrConfig();
    private String redirectBaseUrl = "http://localhost:5173";

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
    public static class MomoConfig {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String endpoint;
        private String returnUrl;
        private String ipnUrl;
    }

    @Getter
    @Setter
    public static class ZalopayConfig {
        private int appId;
        private String key1;
        private String key2;
        private String endpoint;
        private String callbackUrl;
    }
}
