package com.nursingshifts.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** Each month keeps its own goal, so changing next month's goal never rewrites history. */
@Entity
@Table(name = "monthly_goals")
public class MonthlyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Format: yyyy-MM, e.g. "2026-11". */
    @Column(name = "goal_month", nullable = false, unique = true, length = 7)
    private String month;

    @Column(name = "goal_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    protected MonthlyGoal() {
    }

    public MonthlyGoal(String month, BigDecimal amount) {
        this.month = month;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public String getMonth() {
        return month;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
