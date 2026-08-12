export type ReportRangePreset = "today" | "last7" | "last30" | "thisMonth" | "custom";

export interface ResolvedReportRange {
  preset: ReportRangePreset;
  dateFrom: string;
  dateTo: string;
  start: Date;
  endExclusive: Date;
  timezone: string;
}

export interface ReportStore {
  overview(businessId: string, input: { range: ReportRangePreset; dateFrom?: string | undefined; dateTo?: string | undefined }): Promise<unknown>;
}
