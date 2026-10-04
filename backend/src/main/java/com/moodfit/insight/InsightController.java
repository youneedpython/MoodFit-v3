package com.moodfit.insight;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.moodfit.dto.response.ErrorResponse;

@RestController
@RequestMapping("/api")
public class InsightController {
    private final InsightService service;
    public InsightController(InsightService service) { this.service = service; }
    @GetMapping("/check-ins/{id}/insight") public InsightService.InsightResponse insight(@PathVariable Long id) { return service.insight(id, false); }
    @PostMapping("/check-ins/{id}/insight") public InsightService.InsightResponse generate(@PathVariable Long id) { return service.insight(id, true); }
    @GetMapping("/reports/weekly") public InsightService.ReportResponse report() { return service.report(false); }
    @PostMapping("/reports/weekly") public InsightService.ReportResponse generateReport() { return service.report(true); }
    @ExceptionHandler(InsightException.class) public ResponseEntity<ErrorResponse> failure(InsightException error) {
        return ResponseEntity.status(error.status).body(new ErrorResponse(error.code, error.getMessage(), Map.of()));
    }
}
