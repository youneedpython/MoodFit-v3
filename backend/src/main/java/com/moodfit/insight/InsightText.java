package com.moodfit.insight;

public final class InsightText {
    private InsightText() {}
    public static String clean(String text, boolean weekly) {
        if (text == null) return null;
        String cleaned = text.replace("\r\n", "\n").replace('\r', '\n')
                .replace('\t', ' ').replaceAll("[\\p{Cc}&&[^\\n]]", "").strip();
        if (cleaned.isBlank()) return null;
        if (!cleaned.contains("\n")) {
            String[] sentences = cleaned.split("(?<=[.!?])\\s+");
            var formatted = new StringBuilder();
            for (int i = 0; i < sentences.length; i++) {
                if (i > 0) formatted.append(weekly ? (i % 2 == 0 ? "\n\n" : " ") : "\n");
                formatted.append(sentences[i]);
            }
            cleaned = formatted.toString();
        }
        cleaned = cleaned.lines().map(String::strip).collect(java.util.stream.Collectors.joining("\n"))
                .replaceAll("\n{3,}", "\n\n").strip();
        int lengthLimit = weekly ? 1200 : 600;
        int count = cleaned.codePointCount(0, cleaned.length());
        return count > lengthLimit ? cleaned.substring(0, cleaned.offsetByCodePoints(0, lengthLimit)) : cleaned;
    }
}
