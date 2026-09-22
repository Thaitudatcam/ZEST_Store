package com.example.zeststore.service;

import com.example.zeststore.entity.TinNhanAi;
import com.example.zeststore.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiPriceChatTest {
    @Test void priceQuestionUsesCatalogAndPersistsReplyWithoutExternalAi() {
        var ai = mock(OpenAiService.class);
        var messages = mock(TinNhanAiRepository.class);
        var products = mock(SanPhamService.class);
        var resultProducts = List.<Map<String, Object>>of(Map.of(
                "tenSanPham", "Áo Polo Xanh Đen Phối Cổ Thêu",
                "maSanPhamCode", "SP0027", "gia", new BigDecimal("199000")));
        when(products.searchByPriceQuery("sản phẩm rẻ nhất", 1)).thenReturn(resultProducts);
        var service = new AiChatService(ai, mock(HoiThoaiAiRepository.class), messages, products,
                mock(DonHangRepository.class), mock(MucDonHangRepository.class),
                mock(DanhGiaRepository.class), new ObjectMapper());

        var response = service.sendMessage(1, "sản phẩm rẻ nhất", 7, null);

        assertTrue(response.get("reply").toString().contains("199.000đ"));
        assertTrue(response.get("reply").toString().contains("SP0027"));
        assertEquals(resultProducts, response.get("products"));
        assertEquals(7, response.get("maHoiThoai"));
        verifyNoInteractions(ai);
        verify(messages).save(argThat((TinNhanAi m) -> "ai".equals(m.getNguoiGui())
                && m.getNoiDung().equals(response.get("reply")) && m.getSanPham().contains("SP0027")));
    }
}
