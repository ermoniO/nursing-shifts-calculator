package com.nursingshifts.web;

import com.nursingshifts.calc.ShiftStatus;
import com.nursingshifts.service.HistoryService;
import com.nursingshifts.service.MonthService;
import com.nursingshifts.service.ShiftService;
import com.nursingshifts.web.dto.Dtos.FacilityResponse;
import com.nursingshifts.web.dto.Dtos.GoalRequest;
import com.nursingshifts.web.dto.Dtos.HistoryResponse;
import com.nursingshifts.web.dto.Dtos.MonthResponse;
import com.nursingshifts.web.dto.Dtos.ShiftRequest;
import com.nursingshifts.web.dto.Dtos.ShiftResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The whole REST API.
 *
 *   GET  /api/health                     health check for Render (no password needed)
 *   GET  /api/months/{yyyy-MM}           goal, totals, estimate and shifts for the calendar
 *   PUT  /api/months/{yyyy-MM}/goal      set that month's goal
 *   GET  /api/shifts?month=&status=      list view (both filters optional)
 *   POST /api/shifts                     add a shift
 *   PUT  /api/shifts/{id}                edit a shift
 *   POST /api/shifts/{id}/cancel         cancel
 *   POST /api/shifts/{id}/restore        restore
 *   GET  /api/facilities                 facility dropdown (with last rate used)
 *   GET  /api/pay-rates                  pay dropdown
 *   GET  /api/history                    monthly history and analytics
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private final ShiftService shiftService;
    private final MonthService monthService;
    private final HistoryService historyService;

    public ApiController(ShiftService shiftService, MonthService monthService, HistoryService historyService) {
        this.shiftService = shiftService;
        this.monthService = monthService;
        this.historyService = historyService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    // ----- Months -----

    @GetMapping("/months/{month}")
    public MonthResponse month(@PathVariable String month) {
        return monthService.month(YearMonth.parse(month));
    }

    @PutMapping("/months/{month}/goal")
    public MonthResponse setGoal(@PathVariable String month, @Valid @RequestBody GoalRequest request) {
        return monthService.setGoal(YearMonth.parse(month), request.amount());
    }

    // ----- Shifts -----

    @GetMapping("/shifts")
    public List<ShiftResponse> shifts(@RequestParam(required = false) String month,
                                      @RequestParam(required = false) String status) {
        YearMonth m = (month == null || month.isBlank()) ? null : YearMonth.parse(month);
        ShiftStatus s = (status == null || status.isBlank())
                ? null
                : ShiftStatus.valueOf(status.toUpperCase(Locale.ROOT));
        return shiftService.list(m, s);
    }

    @GetMapping("/shifts/{id}")
    public ShiftResponse shift(@PathVariable Long id) {
        return shiftService.get(id);
    }

    @PostMapping("/shifts")
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftResponse create(@Valid @RequestBody ShiftRequest request) {
        return shiftService.create(request);
    }

    @PutMapping("/shifts/{id}")
    public ShiftResponse update(@PathVariable Long id, @Valid @RequestBody ShiftRequest request) {
        return shiftService.update(id, request);
    }

    @PostMapping("/shifts/{id}/cancel")
    public ShiftResponse cancel(@PathVariable Long id) {
        return shiftService.setCanceled(id, true);
    }

    @PostMapping("/shifts/{id}/restore")
    public ShiftResponse restore(@PathVariable Long id) {
        return shiftService.setCanceled(id, false);
    }

    // ----- Dropdowns -----

    @GetMapping("/facilities")
    public List<FacilityResponse> facilities() {
        return shiftService.facilities();
    }

    @GetMapping("/pay-rates")
    public List<BigDecimal> payRates() {
        return shiftService.payRates();
    }

    // ----- History -----

    @GetMapping("/history")
    public HistoryResponse history() {
        return historyService.history();
    }
}
