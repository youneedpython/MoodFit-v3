package com.moodfit.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.response.CheckinResponse;
import com.moodfit.dto.response.HistoryResponse;
import com.moodfit.service.CheckinService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/api/check-ins")
public class CheckinController {

    private final CheckinService checkinService;

    public CheckinController(CheckinService checkinService) {
        this.checkinService = checkinService;
    }

    @PostMapping
    public ResponseEntity<CheckinResponse> create(@Valid @RequestBody CreateCheckinRequest request) {
        CheckinResponse response = checkinService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/latest")
    public CheckinResponse latest() {
        return checkinService.getLatest();
    }

    @GetMapping("/history")
    public HistoryResponse history(@RequestParam(defaultValue = "7") @Min(1) @Max(30) Integer days) {
        return checkinService.getHistory(days);
    }
}
