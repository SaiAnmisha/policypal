package com.policypal.tools;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class DateToolsTest {

    private final DateTools tools = new DateTools();

    @Nested
    class AddToDate {

        @Test
        void addsMonths() {
            assertThat(tools.addToDate("2027-03-02", 2, "months")).contains("2 May 2027");
        }

        @Test
        void handlesShortMonths() {
            assertThat(tools.addToDate("2027-01-31", 1, "month")).contains("28 February 2027");
        }

        @Test
        void addsWeeks() {
            assertThat(tools.addToDate("2027-03-02", 4, "weeks")).contains("30 March 2027");
        }

        @Test
        void rejectsUnknownUnit() {
            assertThat(tools.addToDate("2027-03-02", 2, "fortnights"))
                    .contains("days, weeks, months or years");
        }

        @Test
        void rejectsBadDate() {
            assertThat(tools.addToDate("next Tuesday", 1, "days")).contains("yyyy-MM-dd");
        }

        @Test
        void rejectsAmountOutOfRange() {
            assertThat(tools.addToDate("2027-03-02", 0, "days")).contains("from 1 to 1000");
        }
    }

    @Nested
    class DaysBetween {

        @Test
        void countsDaysAndPeriod() {
            assertThat(tools.daysBetween("2024-03-01", "2026-11-15"))
                    .contains("989 days")
                    .contains("2 years, 8 months and 14 days");
        }

        @Test
        void rejectsDatesInWrongOrder() {
            assertThat(tools.daysBetween("2026-11-15", "2024-03-01")).contains("on or after");
        }
    }

    @Nested
    class ProRata {

        @Test
        void worksOutPartYear() {
            assertThat(tools.proRata(25, "2026-07-01")).contains("12.6 out of 25");
        }

        @Test
        void fullYearWhenStartingOnFirstJanuary() {
            assertThat(tools.proRata(25, "2026-01-01")).contains("25 out of 25");
        }

        @Test
        void rejectsZeroAmount() {
            assertThat(tools.proRata(0, "2026-07-01")).contains("more than 0");
        }
    }
}