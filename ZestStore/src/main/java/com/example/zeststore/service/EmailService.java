package com.example.zeststore.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${app.admin.email}")
    private String[] adminEmails;

    public void sendExcelReport(byte[] excelData, String tuNgay, String denNgay) throws MessagingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setTo(adminEmails);
        helper.setSubject("Báo cáo thống kê ZestStore (" + tuNgay + " → " + denNgay + ")");
        helper.setText("Xin chào,\n\nFile báo cáo thống kê từ " + tuNgay + " đến " + denNgay + " được đính kèm.");
        helper.addAttachment("thong-ke.xlsx", new ByteArrayResource(excelData));
        mailSender.send(msg);
    }
    public void sendStatReport(String tuNgay, String denNgay,
                               Map<String, Object> orderStats,
                               List<Map<String, Object>> revenueDay,
                               List<Map<String, Object>> bestSelling) throws MessagingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setTo(adminEmails);
        helper.setSubject("Báo cáo thống kê ZestStore (" + tuNgay + " → " + denNgay + ")");

        StringBuilder html = new StringBuilder();
        html.append("<h2>Báo cáo thống kê ZestStore</h2>");
        html.append("<p>Từ <b>").append(tuNgay).append("</b> đến <b>").append(denNgay).append("</b></p>");

        // Thống kê đơn hàng
        html.append("<h3>📦 Thống kê đơn hàng</h3>");
        html.append("<table border='1' cellpadding='8' cellspacing='0'>");
        html.append("<tr><th>Chỉ tiêu</th><th>Số lượng</th></tr>");
        html.append("<tr><td>Tổng đơn hàng</td><td>").append(orderStats.get("totalOrders")).append("</td></tr>");
        html.append("<tr><td>Đang chờ</td><td>").append(orderStats.get("pending")).append("</td></tr>");
        html.append("<tr><td>Đang giao</td><td>").append(orderStats.get("shipping")).append("</td></tr>");
        html.append("<tr><td>Đã giao</td><td>").append(orderStats.get("completed")).append("</td></tr>");
        html.append("<tr><td>Đã hủy</td><td>").append(orderStats.get("cancelled")).append("</td></tr>");
        html.append("</table>");

        // Doanh thu theo ngày
        html.append("<h3>💰 Doanh thu theo ngày</h3>");
        html.append("<table border='1' cellpadding='8' cellspacing='0'>");
        html.append("<tr><th>Ngày</th><th>Doanh thu</th></tr>");
        for (Map<String, Object> item : revenueDay) {
            html.append("<tr><td>").append(item.get("ngay")).append("</td><td>")
                    .append(item.get("doanhThu")).append(" đ</td></tr>");
        }
        html.append("</table>");

        // Sản phẩm bán chạy
        html.append("<h3>🏆 Sản phẩm bán chạy</h3>");
        html.append("<table border='1' cellpadding='8' cellspacing='0'>");
        html.append("<tr><th>Tên sản phẩm</th><th>Số lượng đã bán</th></tr>");
        for (Map<String, Object> item : bestSelling) {
            html.append("<tr><td>").append(item.get("tenSanPham")).append("</td><td>")
                    .append(item.get("soLuongDaBan")).append("</td></tr>");
        }
        html.append("</table>");

        helper.setText(html.toString(), true); // true = HTML
        mailSender.send(msg);
    }
}
