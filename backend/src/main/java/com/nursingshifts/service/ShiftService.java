package com.nursingshifts.service;

import com.nursingshifts.calc.ShiftMath;
import com.nursingshifts.calc.ShiftStatus;
import com.nursingshifts.config.AppClock;
import com.nursingshifts.domain.Facility;
import com.nursingshifts.domain.FacilityRepository;
import com.nursingshifts.domain.Shift;
import com.nursingshifts.domain.ShiftRepository;
import com.nursingshifts.web.ApiErrors.ConflictException;
import com.nursingshifts.web.ApiErrors.NotFoundException;
import com.nursingshifts.web.dto.Dtos.FacilityResponse;
import com.nursingshifts.web.dto.Dtos.ShiftRequest;
import com.nursingshifts.web.dto.Dtos.ShiftResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ShiftService {

    private static final DateTimeFormatter LONG_DATE = DateTimeFormatter.ofPattern("MMMM d");

    private final ShiftRepository shifts;
    private final FacilityRepository facilities;
    private final AppClock clock;

    public ShiftService(ShiftRepository shifts, FacilityRepository facilities, AppClock clock) {
        this.shifts = shifts;
        this.facilities = facilities;
        this.clock = clock;
    }

    // ---------- Reads ----------

    @Transactional(readOnly = true)
    public List<ShiftResponse> list(YearMonth month, ShiftStatus status) {
        List<Shift> found = month == null
                ? shifts.findAllByOrderByDateDesc()
                : shifts.findByDateBetweenOrderByDateAsc(month.atDay(1), month.atEndOfMonth());
        LocalDate today = clock.today();
        return found.stream()
                .map(s -> toResponse(s, today))
                .filter(r -> status == null || r.status() == status)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShiftResponse get(Long id) {
        return toResponse(find(id), clock.today());
    }

    @Transactional(readOnly = true)
    public List<FacilityResponse> facilities() {
        return facilities.findAllByOrderByNameAsc().stream()
                .map(f -> new FacilityResponse(
                        f.getId(),
                        f.getName(),
                        shifts.findFirstByFacilityAndCanceledFalseOrderByDateDesc(f)
                                .map(Shift::getHourlyPay)
                                .orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BigDecimal> payRates() {
        return shifts.findDistinctHourlyPay();
    }

    // ---------- Writes ----------

    @Transactional
    public ShiftResponse create(ShiftRequest request) {
        ensureDateIsFree(request.date(), null);
        Shift shift = new Shift();
        apply(shift, request);
        return toResponse(shifts.save(shift), clock.today());
    }

    @Transactional
    public ShiftResponse update(Long id, ShiftRequest request) {
        Shift shift = find(id);
        ensureDateIsFree(request.date(), id);
        apply(shift, request);
        return toResponse(shift, clock.today());
    }

    @Transactional
    public ShiftResponse setCanceled(Long id, boolean canceled) {
        Shift shift = find(id);
        shift.setCanceled(canceled);
        return toResponse(shift, clock.today());
    }

    // ---------- Helpers ----------

    public ShiftResponse toResponse(Shift s, LocalDate today) {
        return new ShiftResponse(
                s.getId(),
                s.getDate(),
                s.getFacility().getName(),
                s.getStartTime(),
                ShiftMath.endTime(s.getStartTime(), s.getHours()),
                s.getHours(),
                s.getHourlyPay(),
                ShiftMath.shiftPay(s.getHours(), s.getHourlyPay()),
                ShiftMath.status(s.getDate(), s.isCanceled(), today));
    }

    private void apply(Shift shift, ShiftRequest request) {
        shift.setDate(request.date());
        shift.setFacility(findOrCreateFacility(request.facility()));
        shift.setStartTime(request.startTime());
        shift.setHours(request.hours());
        shift.setHourlyPay(request.hourlyPay());
    }

    /** One shift per date. A canceled shift still holds its date; edit and restore it instead. */
    private void ensureDateIsFree(LocalDate date, Long editingId) {
        Optional<Shift> existing = shifts.findByDate(date);
        if (existing.isPresent() && !existing.get().getId().equals(editingId)) {
            String when = date.format(LONG_DATE);
            String message = existing.get().isCanceled()
                    ? "There's a canceled shift on " + when + ". Open it to edit and restore it."
                    : "You already have a shift on " + when + ".";
            throw new ConflictException(message);
        }
    }

    private Facility findOrCreateFacility(String rawName) {
        String name = rawName.trim().replaceAll("\\s+", " ");
        return facilities.findByNameIgnoreCase(name)
                .orElseGet(() -> facilities.save(new Facility(name)));
    }

    private Shift find(Long id) {
        return shifts.findById(id).orElseThrow(() -> new NotFoundException("Shift not found"));
    }
}
