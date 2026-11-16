package com.nursingshifts.web.dto;

import com.nursingshifts.calc.ShiftStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Request and response shapes for the API, kept together for easy reading. */
public final class Dtos {

    private Dtos() {
    }

    // ---------- Requests ----------

    public record LoginRequest(@NotBlank String password) {
    }

    public record ShiftRequest(
            @NotNull(message = "Date is required") LocalDate date,
            @NotBlank(message = "Facility is required") @Size(max = 120) String facility,
            @NotNull(message = "Start time is required") LocalTime startTime,
            @NotNull(message = "Hours are required")
            @DecimalMin(value = "0.25", message = "Hours must be at least 0.25")
            @DecimalMax(value = "24", message = "Hours can't be more than 24") BigDecimal hours,
            @NotNull(message = "Hourly pay is required")
            @DecimalMin(value = "0.01", message = "Hourly pay must be more than $0") BigDecimal hourlyPay) {
    }

    public record GoalRequest(
            @NotNull(message = "Goal is required")
            @DecimalMin(value = "0", message = "Goal can't be negative") BigDecimal amount) {
    }

    // ---------- Responses ----------

    public record TokenResponse(String token) {
    }

    public record MessageResponse(String message) {
    }

    public record ShiftResponse(Long id,
                                LocalDate date,
                                String facility,
                                LocalTime startTime,
                                LocalTime endTime,
                                BigDecimal hours,
                                BigDecimal hourlyPay,
                                BigDecimal pay,
                                ShiftStatus status) {
    }

    public record EstimateResponse(BigDecimal averageHourlyPay,
                                   long twelveHourShifts,
                                   long eightHourShifts,
                                   long hours) {
    }

    /** Everything the calendar needs for one month. */
    public record MonthResponse(String month,
                                BigDecimal goal,
                                BigDecimal earned,
                                BigDecimal scheduled,
                                BigDecimal stillNeeded,
                                boolean goalMet,
                                EstimateResponse estimate,
                                List<ShiftResponse> shifts) {
    }

    public record FacilityResponse(Long id, String name, BigDecimal lastRate) {
    }

    public record FacilityIncome(String facility, BigDecimal earned, int shifts) {
    }

    public record MonthHistory(String month,
                               boolean inProgress,
                               BigDecimal goal,
                               BigDecimal earned,
                               Integer percentOfGoal,
                               BigDecimal difference,
                               int completedShifts,
                               BigDecimal totalHours,
                               BigDecimal averageHourlyPay,
                               BigDecimal averageShiftPay,
                               List<FacilityIncome> byFacility) {
    }

    public record HistoryResponse(List<MonthHistory> months,
                                  String bestMonth,
                                  BigDecimal bestMonthEarned,
                                  BigDecimal averageMonthlyIncome,
                                  int monthsGoalMet,
                                  int monthsWithGoal) {
    }
}
