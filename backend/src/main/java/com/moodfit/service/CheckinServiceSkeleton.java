package com.moodfit.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.response.CheckinResponse;
import com.moodfit.dto.response.HistoryResponse;
import com.moodfit.exception.CheckinNotFoundException;
import com.moodfit.exception.PendingImplementationException;

@Service
public class CheckinServiceSkeleton implements CheckinService {

    @Override
    public CheckinResponse create(CreateCheckinRequest request) {
        throw new PendingImplementationException(
                "Check-in persistence, wellness analysis, and recommendation rules are pending Gate B/TASK-006.");
    }

    @Override
    public CheckinResponse getLatest() {
        throw new CheckinNotFoundException();
    }

    @Override
    public HistoryResponse getHistory(int days) {
        return new HistoryResponse(days, List.of());
    }
}
