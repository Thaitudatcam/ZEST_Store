package com.example.zeststore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootTest
class ZestStoreApplicationTests {
    @Autowired
    private DataSource dataSource;

    @Test
    void testConnection() {
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("✅ Kết nối thành công: " + conn.getMetaData().getURL());
        } catch (Exception e) {
            System.err.println("❌ Lỗi: " + e.getMessage());
            e.printStackTrace();
        }
    }
    @Test
    void contextLoads() {
    }

}
