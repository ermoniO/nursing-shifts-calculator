package com.nursingshifts.service;

import com.nursingshifts.calc.ShiftMath;
import com.nursingshifts.calc.ShiftStatus;
import com.nursingshifts.config.AppClock;
import com.nursingshifts.domain.MonthlyGoal;
import com.nursingshifts.domain.MonthlyGoalRepository;
import com.nursingshifts.domain.Shift;
import com.nursingshifts.domain.ShiftRepository;
import com.nursingshifts.web.dto.Dtos.FacilityIncome;
import com.nursingshifts.web.dto.Dtos.HistoryResponse;
import com.nursingshifts.web.dto.Dtos.MonthHistory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * Month-by-month results. History counts only Completed shifts and is always
 * recalculated from the shifts, so canceling or restoring a past shift fixes
 * that month automatically.
 */
@Service
public class HistoryService {

    private final ShiftRepository shifts;
    private final MonthlyGoalRepository goals;
    private final AppClock clock;

    public HistoryService(ShiftRepository shifts, MonthlyGoalRepository goals, AppClock clock) {
        this.shifts = shifts;
        this.goals = goals;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public HistoryResponse history() {
        LocalDate today = clock.today();
        YearMonth current = clock.currentMonth();

        Map<YearMonth, BigDecimal> goalByMonth = new HashMap<>();
        for (MonthlyGoal g : goals.findAll()) {
            goalByMonth.put(YearMonth.parse(g.getMonth()), g.getAmount());
        }

        Map<YearMonth, List<Shift>> completedByMonth = new HashMap<>();
        TreeSet<YearMonth> months = new TreeSet<>(Comparator.reverseOrder());
        for (Shift s : shifts.findAll()) {
            YearMonth m = YearMonth.from(s.getDate());
            months.add(m);
            if (ShiftMath.status(s.getDate(), s.isCanceled(), today) == ShiftStatus.COMPLETED) {
                completedByMonth.computeIfAbsent(m, k -> new ArrayList<>()).add(s);
            }
        }
        months.addAll(goalByMonth.keySet());
        months.removeIf(m -> m.isAfter(current)); // future months aren't history yet

        List<MonthHistory> result = new ArrayList<>();
        for (YearMonth m : months) {
            result.add(summarize(m, m.equals(current), goalByMonth.get(m),
                    completedByMonth.getOrDefault(m, List.of())));
        }
        return withTotals(result);
    }

    private MonthHistory summarize(YearMonth month, boolean inProgress, BigDecimal goal, List<Shift> completed) {
        BigDecimal earned = BigDecimal.ZERO.setScale(2);
        BigDecimal hours = BigDecimal.ZERO.setScale(2);
        Map<String, BigDecimal> facilityEarned = new HashMap<>();
        Map<String, Integer> facilityCount = new HashMap<>();

        for (Shift s : completed) {
            BigDecimal pay = ShiftMath.shiftPay(s.getHours(), s.getHourlyPay());
            earned = earned.add(pay);
            hours = hours.add(s.getHours());
            String name = s.getFacility().getName();
            facilityEarned.merge(name, pay, BigDecimal::add);
            facilityCount.merge(name, 1, Integer::sum);
        }

        List<FacilityIncome> byFacility = facilityEarned.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(e -> new FacilityIncome(e.getKey(), e.getValue(), facilityCount.get(e.getKey())))
                .toList();

        return new MonthHistory(
                month.toString(),
                inProgress,
                goal,
                earned,
                ShiftMath.percentOfGoal(earned, goal),
                goal == null ? null : earned.subtract(goal),
                completed.size(),
                hours,
                ShiftMath.averageHourly(earned, hours),
                ShiftMath.averagePer(earned, completed.size()),
                byFacility);
    }

    private HistoryResponse withTotals(List<MonthHistory> months) {
        MonthHistory best = months.stream()
                .filter(m -> m.earned().signum() > 0)
                .max(Comparator.comparing(MonthHistory::earned))
                .orElse(null);

        List<MonthHistory> finished = months.stream().filter(m -> !m.inProgress()).toList();
        BigDecimal finishedTotal = finished.stream()
                .map(MonthHistory::earned)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int withGoal = 0;
        int met = 0;
        for (MonthHistory m : months) {
            if (m.goal() == null) {
                continue;
            }
            boolean isMet = m.earned().compareTo(m.goal()) >= 0;
            // The current month only counts once it's met; otherwise it's still in progress.
            if (!m.inProgress() || isMet) {
                withGoal++;
                if (isMet) {
                    met++;
                }
            }
        }

        return new HistoryResponse(
                months,
                best == null ? null : best.month(),
                best == null ? null : best.earned(),
                ShiftMath.averagePer(finishedTotal, finished.size()),
                met,
                withGoal);
    }
}
