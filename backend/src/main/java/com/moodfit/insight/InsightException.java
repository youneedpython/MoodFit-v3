package com.moodfit.insight;

public class InsightException extends RuntimeException {
    final int status;
    final String code;
    public InsightException(int status, String code, String message) { super(message); this.status = status; this.code = code; }
}
