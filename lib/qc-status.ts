import type { QcResult } from "@/lib/types";

export const QC_RESULT_LABELS: Record<QcResult, string> = {
  pass: "Pass",
  conditional: "Conditional",
  fail: "Fail",
};

export const QC_RESULT_CLASSES: Record<QcResult, string> = {
  pass: "bg-primary-100 text-primary-800 hover:bg-primary-100",
  conditional: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  fail: "bg-destructive/15 text-destructive hover:bg-destructive/15",
};
