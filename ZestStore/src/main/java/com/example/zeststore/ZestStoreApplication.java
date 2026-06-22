package com.example.zeststore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ZestStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZestStoreApplication.class, args);
    }

}
