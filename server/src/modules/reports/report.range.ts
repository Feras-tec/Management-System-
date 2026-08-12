import { DateTime } from "luxon";
import { AppError } from "../../shared/errors/app-error.js";
import type { ReportRangePreset, ResolvedReportRange } from "./report.types.js";

export function resolveReportRange(
  preset: ReportRangePreset,
  timezone: string,
  dateFrom?: string,
  dateTo?: string,
  now = DateTime.now(),
): ResolvedReportRange {
  const localNow = now.setZone(timezone);
  let start: DateTime;
  let endDay: DateTime;

  if (preset === "custom") {
    start = DateTime.fromISO(dateFrom ?? "", { zone: timezone }).startOf("day");
    endDay = DateTime.fromISO(dateTo ?? "", { zone: timezone }).startOf("day");
  } else if (preset === "today") {
    start = localNow.startOf("day");
    endDay = start;
  } else if (preset === "last7") {
    endDay = localNow.startOf("day");
    start = endDay.minus({ days: 6 });
  } else if (preset === "thisMonth") {
    start = localNow.startOf("month");
    endDay = localNow.startOf("day");
  } else {
    endDay = localNow.startOf("day");
    start = endDay.minus({ days: 29 });
  }

  if (!start.isValid || !endDay.isValid || start > endDay) {
    throw new AppError(400, "INVALID_REPORT_RANGE", "The report date range is invalid.");
  }
  if (endDay.diff(start, "days").days > 366) {
    throw new AppError(400, "REPORT_RANGE_TOO_LARGE", "Report ranges are limited to 366 days.");
  }

  return {
    preset,
    dateFrom: start.toISODate()!,
    dateTo: endDay.toISODate()!,
    start: start.toUTC().toJSDate(),
    endExclusive: endDay.plus({ days: 1 }).toUTC().toJSDate(),
    timezone,
  };
}
