package com.moodfit.insight;

public final class InsightText {
    private InsightText() {}
    public static String clean(String text, boolean weekly) {
        if (text == null) return null;
        String cleaned = text.replace("\r\n", "\n").replace('\r', '\n')
                .replace('\t', ' ').replaceAll("[\\p{Cc}&&[^\\n]]", "").strip();
        if (cleaned.isBlank()) return null;
        int lengthLimit = weekly ? 1200 : 600;
        int count = cleaned.codePointCount(0, cleaned.length());
        return count > lengthLimit ? cleaned.substring(0, cleaned.offsetByCodePoints(0, lengthLimit)) : cleaned;
    }
}
