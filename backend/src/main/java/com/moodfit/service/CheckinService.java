package com.moodfit.service;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.response.CheckinResponse;
import com.moodfit.dto.response.HistoryResponse;

public interface CheckinService {

    CheckinResponse create(CreateCheckinRequest request);

    CheckinResponse getLatest();

    HistoryResponse getHistory(int days);
}
