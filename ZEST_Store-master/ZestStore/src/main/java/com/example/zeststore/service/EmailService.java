package com.example.zeststore.service;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${app.admin.email}")
    private String adminEmail;

    public void sendExcelReport(byte[] excelData, String tuNgay, String denNgay) throws MessagingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setTo(adminEmail);
        helper.setSubject("Báo cáo thống kê ZestStore (" + tuNgay + " → " + denNgay + ")");
        helper.setText("Xin chào,\n\nFile báo cáo thống kê từ " + tuNgay + " đến " + denNgay + " được đính kèm.");
        helper.addAttachment("thong-ke.xlsx", new ByteArrayResource(excelData));
        mailSender.send(msg);
    }
}
