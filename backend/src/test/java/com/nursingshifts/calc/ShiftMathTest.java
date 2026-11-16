package com.nursingshifts.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ShiftMathTest {

    private static BigDecimal d(String v) {
        return new BigDecimal(v);
    }

    @Test
    void shiftPayRoundsDownToTheCent() {
        assertEquals(d("540.00"), ShiftMath.shiftPay(d("12"), d("45")));
        assertEquals(d("249.97"), ShiftMath.shiftPay(d("7.5"), d("33.33"))); // 249.975
    }

    @Test
    void endTimeAddsHoursAndWrapsPastMidnight() {
        assertEquals(LocalTime.of(19, 0), ShiftMath.endTime(LocalTime.of(7, 0), d("12")));
        assertEquals(LocalTime.of(14, 30), ShiftMath.endTime(LocalTime.of(9, 0), d("5.5")));
        assertEquals(LocalTime.of(7, 0), ShiftMath.endTime(LocalTime.of(19, 0), d("12")));
    }

    @Test
    void statusComesFromTheDate() {
        LocalDate today = LocalDate.of(2026, 11, 11);
        assertEquals(ShiftStatus.SCHEDULED, ShiftMath.status(today, false, today));
        assertEquals(ShiftStatus.COMPLETED, ShiftMath.status(today.minusDays(1), false, today));
        assertEquals(ShiftStatus.CANCELED, ShiftMath.status(today.minusDays(1), true, today));
    }

    @Test
    void estimateMatchesTheSpecExample() {
        // $2,000 still needed at a $45/hour average
        ShiftMath.Estimate e = ShiftMath.estimate(d("2000"), d("45"));
        assertEquals(3, e.twelveHourShifts()); // 3.7 rounds down
        assertEquals(5, e.eightHourShifts());  // 5.5 rounds down
        assertEquals(44, e.hours());           // 44.4 rounds down
    }

    @Test
    void noEstimateWhenGoalMetOrNoHistory() {
        assertNull(ShiftMath.estimate(d("0"), d("45")));
        assertNull(ShiftMath.estimate(d("500"), null));
    }

    @Test
    void averagesAndPercentRoundDown() {
        assertEquals(d("45.33"), ShiftMath.averageHourly(d("1088"), d("24"))); // 45.333...
        assertEquals(99, ShiftMath.percentOfGoal(d("4999"), d("5000")));
        assertNull(ShiftMath.averageHourly(d("0"), d("0")));
    }
}
