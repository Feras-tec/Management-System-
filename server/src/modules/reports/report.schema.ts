import { z } from "zod";

export const reportRangeQuery = z
  .object({
    range: z.enum(["today", "last7", "last30", "thisMonth", "custom"]).default("last30"),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  })
  .superRefine((value, context) => {
    if (value.range === "custom" && (!value.dateFrom || !value.dateTo)) {
      context.addIssue({ code: "custom", message: "Custom ranges require dateFrom and dateTo." });
    }
  });

export type ReportRangeInput = z.infer<typeof reportRangeQuery>;
