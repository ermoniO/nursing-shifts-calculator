package com.nursingshifts.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * "Today" in your time zone (APP_TIMEZONE), not the server's.
 * Render's servers run on UTC, so without this a shift would flip to
 * Completed at 6 p.m. Central instead of midnight.
 */
@Component
public class AppClock {

    private final ZoneId zone;

    public AppClock(@Value("${app.timezone}") String timezone) {
        this.zone = ZoneId.of(timezone);
    }

    public LocalDate today() {
        return LocalDate.now(zone);
    }

    public YearMonth currentMonth() {
        return YearMonth.now(zone);
    }
}
