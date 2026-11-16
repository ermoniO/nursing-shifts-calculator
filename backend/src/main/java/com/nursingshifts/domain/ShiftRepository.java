package com.nursingshifts.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    List<Shift> findByDateBetweenOrderByDateAsc(LocalDate start, LocalDate end);

    List<Shift> findAllByOrderByDateDesc();

    List<Shift> findByCanceledFalse();

    Optional<Shift> findByDate(LocalDate date);

    /** Most recent non-canceled shift at a facility, used to pre-fill its last rate. */
    Optional<Shift> findFirstByFacilityAndCanceledFalseOrderByDateDesc(Facility facility);

    /** Every hourly rate used before, for the pay dropdown. */
    @Query("select distinct s.hourlyPay from Shift s order by s.hourlyPay desc")
    List<BigDecimal> findDistinctHourlyPay();
}
