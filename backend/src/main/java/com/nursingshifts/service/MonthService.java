package com.nursingshifts.service;

import com.nursingshifts.calc.ShiftMath;
import com.nursingshifts.calc.ShiftStatus;
import com.nursingshifts.config.AppClock;
import com.nursingshifts.domain.MonthlyGoal;
import com.nursingshifts.domain.MonthlyGoalRepository;
import com.nursingshifts.domain.Shift;
import com.nursingshifts.domain.ShiftRepository;
import com.nursingshifts.web.dto.Dtos.EstimateResponse;
import com.nursingshifts.web.dto.Dtos.MonthResponse;
import com.nursingshifts.web.dto.Dtos.ShiftResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class MonthService {

    private final ShiftRepository shifts;
    private final MonthlyGoalRepository goals;
    private final ShiftService shiftService;
    private final AppClock clock;

    public MonthService(ShiftRepository shifts, MonthlyGoalRepository goals,
                        ShiftService shiftService, AppClock clock) {
        this.shifts = shifts;
        this.goals = goals;
        this.shiftService = shiftService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public MonthResponse month(YearMonth month) {
        LocalDate today = clock.today();
        List<ShiftResponse> monthShifts = shifts
                .findByDateBetweenOrderByDateAsc(month.atDay(1), month.atEndOfMonth())
                .stream()
                .map(s -> shiftService.toResponse(s, today))
                .toList();

        BigDecimal earned = sumPay(monthShifts, ShiftStatus.COMPLETED);
        BigDecimal scheduled = sumPay(monthShifts, ShiftStatus.SCHEDULED);
        BigDecimal goal = goals.findByMonth(month.toString()).map(MonthlyGoal::getAmount).orElse(null);

        BigDecimal stillNeeded = null;
        boolean goalMet = false;
        EstimateResponse estimate = null;

        if (goal != null) {
            BigDecimal remaining = goal.subtract(earned).subtract(scheduled);
            goalMet = remaining.signum() <= 0;
            stillNeeded = goalMet ? BigDecimal.ZERO.setScale(2) : remaining;
            ShiftMath.Estimate e = ShiftMath.estimate(stillNeeded, averageHourlyAllShifts());
            if (e != null) {
                estimate = new EstimateResponse(e.averageHourlyPay(), e.twelveHourShifts(),
                        e.eightHourShifts(), e.hours());
            }
        }

        return new MonthResponse(month.toString(), goal, earned, scheduled,
                stillNeeded, goalMet, estimate, monthShifts);
    }

    @Transactional
    public MonthResponse setGoal(YearMonth month, BigDecimal amount) {
        MonthlyGoal goal = goals.findByMonth(month.toString())
                .orElseGet(() -> new MonthlyGoal(month.toString(), amount));
        goal.setAmount(amount);
        goals.save(goal);
        return month(month);
    }

    /** Average hourly pay across every non-canceled shift (total pay / total hours). */
    private BigDecimal averageHourlyAllShifts() {
        BigDecimal totalPay = BigDecimal.ZERO;
        BigDecimal totalHours = BigDecimal.ZERO;
        for (Shift s : shifts.findByCanceledFalse()) {
            totalPay = totalPay.add(ShiftMath.shiftPay(s.getHours(), s.getHourlyPay()));
            totalHours = totalHours.add(s.getHours());
        }
        return ShiftMath.averageHourly(totalPay, totalHours);
    }

    private static BigDecimal sumPay(List<ShiftResponse> list, ShiftStatus status) {
        return list.stream()
                .filter(s -> s.status() == status)
                .map(ShiftResponse::pay)
                .reduce(BigDecimal.ZERO.setScale(2), BigDecimal::add);
    }
}
