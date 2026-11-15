package com.policypal.tools;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DateTools {
    private static final Logger log = LoggerFactory.getLogger(DateTools.class);
    private static final DateTimeFormatter UK_DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.UK);
    private static final String DATE_FORMAT_HELP = "Dates must be in the format yyyy-MM-dd, for example 2027-03-02.";

    @Tool(description = "Get today's date. Use this when the user says today, now, this week or this year.")
    public String today() {
        log.info("Tool today called");
        LocalDate now = LocalDate.now();
        return now + " (" + now.format(UK_DATE) + ")";
    }

    @Tool(description = "Add an amount of time to a date and return the new date. "
            + "Use it for notice periods, probation periods, deadlines and renewal dates.")
    public String addToDate(
            @ToolParam(description = "Start date in the format yyyy-MM-dd") String date,
            @ToolParam(description = "How much time to add, a whole number from 1 to 1000") int amount,
            @ToolParam(description = "The unit of time: days, weeks, months or years") String unit) {
        log.info("Tool addToDate called: date={}, amount={}, unit={}", date, amount, unit);
        LocalDate start = parse(date);
        if (start == null) {
            return DATE_FORMAT_HELP;
        }
        if (amount < 1 || amount > 1000) {
            return "The amount must be a whole number from 1 to 1000.";
        }

        LocalDate result;
        switch (unit == null ? "" : unit.strip().toLowerCase(Locale.UK)) {
            case "day", "days" -> result = start.plusDays(amount);
            case "week", "weeks" -> result = start.plusWeeks(amount);
            case "month", "months" -> result = start.plusMonths(amount);
            case "year", "years" -> result = start.plusYears(amount);
            default -> {
                return "The unit must be days, weeks, months or years.";
            }
        }

        return start.format(UK_DATE) + " plus " + amount + " " + unit.strip()
                + " is " + result.format(UK_DATE) + ".";
    }

    @Tool(description = "Count the time between two dates. "
            + "Use it for length of service, time left on a contract or how long ago something happened.")
    public String daysBetween(
            @ToolParam(description = "The earlier date, in the format yyyy-MM-dd") String from,
            @ToolParam(description = "The later date, in the format yyyy-MM-dd") String to) {
        log.info("Tool daysBetween called: from={}, to={}", from, to);
        LocalDate start = parse(from);
        LocalDate end = parse(to);
        if (start == null || end == null) {
            return DATE_FORMAT_HELP;
        }
        if (end.isBefore(start)) {
            return "The second date must be on or after the first date.";
        }

        long days = ChronoUnit.DAYS.between(start, end);
        Period period = Period.between(start, end);

        return "From " + start.format(UK_DATE) + " to " + end.format(UK_DATE) + " is " + days + " days ("
                + period.getYears() + " years, " + period.getMonths() + " months and "
                + period.getDays() + " days).";
    }

    @Tool(description = "Work out a pro rata amount for someone who started partway through the year, "
            + "for example annual leave. Assumes the year runs from 1 January to 31 December.")
    public String proRata(
            @ToolParam(description = "The full-year amount, for example 25 for 25 days of leave") double fullAmount,
            @ToolParam(description = "The date the person started, in the format yyyy-MM-dd") String startDate) {
        log.info("Tool proRata called: fullAmount={}, startDate={}", fullAmount, startDate);
        LocalDate start = parse(startDate);
        if (start == null) {
            return DATE_FORMAT_HELP;
        }
        if (fullAmount <= 0 || fullAmount > 1000) {
            return "The full-year amount must be more than 0 and no more than 1000.";
        }

        LocalDate endOfYear = LocalDate.of(start.getYear(), 12, 31);
        long daysLeft = ChronoUnit.DAYS.between(start, endOfYear) + 1;
        int daysInYear = start.lengthOfYear();

        BigDecimal result = BigDecimal.valueOf(fullAmount * daysLeft / daysInYear)
                .setScale(1, RoundingMode.HALF_UP)
                .stripTrailingZeros();

        return "Starting on " + start.format(UK_DATE) + " leaves " + daysLeft + " of " + daysInYear
                + " days in the year, so the pro rata amount is " + result.toPlainString()
                + " out of " + BigDecimal.valueOf(fullAmount).stripTrailingZeros().toPlainString() + ".";
    }

    // Returns null when the text is not a valid yyyy-MM-dd date
    private static LocalDate parse(String text) {
        if (text == null) {
            return null;
        }
        try {
            return LocalDate.parse(text.strip());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}