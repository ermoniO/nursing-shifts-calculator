package com.nursingshifts.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * All of the app's math in one place, with no Spring or database code,
 * so it is easy to read and to unit test.
 *
 * Rounding rule from the spec: every calculated number rounds DOWN.
 */
public final class ShiftMath {

    private static final BigDecimal SIXTY = BigDecimal.valueOf(60);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TWELVE = BigDecimal.valueOf(12);
    private static final BigDecimal EIGHT = BigDecimal.valueOf(8);

    private ShiftMath() {
    }

    /** Hours x hourly pay, rounded down to the cent. */
    public static BigDecimal shiftPay(BigDecimal hours, BigDecimal hourlyPay) {
        return hours.multiply(hourlyPay).setScale(2, RoundingMode.FLOOR);
    }

    /** Start time + hours. Wraps past midnight; all pay still counts on the start date. */
    public static LocalTime endTime(LocalTime start, BigDecimal hours) {
        long minutes = hours.multiply(SIXTY).setScale(0, RoundingMode.FLOOR).longValue();
        return start.plusMinutes(minutes);
    }

    /**
     * Only "canceled" is stored. Scheduled vs Completed comes from the date:
     * a shift is Scheduled through the end of its date and Completed after that.
     */
    public static ShiftStatus status(LocalDate shiftDate, boolean canceled, LocalDate today) {
        if (canceled) {
            return ShiftStatus.CANCELED;
        }
        return shiftDate.isBefore(today) ? ShiftStatus.COMPLETED : ShiftStatus.SCHEDULED;
    }

    /** Total pay / total hours, rounded down to the cent. Null when there are no hours yet. */
    public static BigDecimal averageHourly(BigDecimal totalPay, BigDecimal totalHours) {
        if (totalHours == null || totalHours.signum() <= 0) {
            return null;
        }
        return totalPay.divide(totalHours, 2, RoundingMode.FLOOR);
    }

    /** Total / count, rounded down to the cent. Null when count is zero. */
    public static BigDecimal averagePer(BigDecimal total, long count) {
        if (count <= 0) {
            return null;
        }
        return total.divide(BigDecimal.valueOf(count), 2, RoundingMode.FLOOR);
    }

    /** Whole percent of goal reached, rounded down. Null when there is no goal (or a $0 goal). */
    public static Integer percentOfGoal(BigDecimal earned, BigDecimal goal) {
        if (goal == null || goal.signum() <= 0) {
            return null;
        }
        return earned.multiply(HUNDRED).divide(goal, 0, RoundingMode.FLOOR).intValue();
    }

    /**
     * How many more 12-hour shifts, 8-hour shifts or hours are needed, based on the
     * average hourly pay. Every count rounds down, so the estimate can land a little
     * short of the goal; the app always shows the dollars still needed beside it.
     *
     * Returns null when nothing is still needed or there is no average yet.
     */
    public static Estimate estimate(BigDecimal stillNeeded, BigDecimal averageHourly) {
        if (stillNeeded == null || stillNeeded.signum() <= 0) {
            return null;
        }
        if (averageHourly == null || averageHourly.signum() <= 0) {
            return null;
        }
        long twelve = stillNeeded.divide(averageHourly.multiply(TWELVE), 0, RoundingMode.FLOOR).longValue();
        long eight = stillNeeded.divide(averageHourly.multiply(EIGHT), 0, RoundingMode.FLOOR).longValue();
        long hours = stillNeeded.divide(averageHourly, 0, RoundingMode.FLOOR).longValue();
        return new Estimate(averageHourly, twelve, eight, hours);
    }

    public record Estimate(BigDecimal averageHourlyPay,
                           long twelveHourShifts,
                           long eightHourShifts,
                           long hours) {
    }
}
