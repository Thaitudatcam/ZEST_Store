package com.example.zeststore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "ghn")
public class GhnConfig {
    private String token;
    private int shopId;
    private String baseUrl;
    private int fromDistrictId;
    private String fromWardCode;
}
