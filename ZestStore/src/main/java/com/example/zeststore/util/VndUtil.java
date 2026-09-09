package com.example.zeststore.util;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public final class VndUtil {

    private static final DecimalFormat FORMAT = new DecimalFormat("#,##0",
            DecimalFormatSymbols.getInstance(Locale.GERMANY));

    private VndUtil() {}

    public static String format(Number value) {
        if (value == null) return "0";
        return FORMAT.format(value);
    }
}
