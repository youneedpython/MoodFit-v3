package com.moodfit.dto.response;

import java.util.List;

public record HistoryResponse(
        Integer days,
        List<HistoryItemResponse> items) {
}
