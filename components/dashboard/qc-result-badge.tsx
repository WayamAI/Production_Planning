import { Badge } from "@/components/ui/badge";
import { QC_RESULT_CLASSES, QC_RESULT_LABELS } from "@/lib/qc-status";
import type { QcResult } from "@/lib/types";

export function QcResultBadge({ result }: { result: QcResult }) {
  return <Badge className={QC_RESULT_CLASSES[result]}>{QC_RESULT_LABELS[result]}</Badge>;
}
