import type { MaterialLot, Supplier } from "@/lib/types";

interface LotRecordCardProps {
  lot: MaterialLot;
  supplier?: Supplier;
}

export function LotRecordCard({ lot, supplier }: LotRecordCardProps) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/50 p-4 dark:bg-amber-950/20">
      <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
        SBOM — Supplier Bill of Materials
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Material</p>
          <p>{lot.materialName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Supplier</p>
          <p>{supplier?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Supplier Lot</p>
          <p>{lot.supplierLotNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Heat Number</p>
          <p>{lot.heatNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">GR Date</p>
          <p>{lot.grDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">CoC Ref</p>
          <p>{lot.coCRef}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Inspection</p>
          <p className={lot.inspectionResult === "failed" ? "font-medium text-destructive" : ""}>
            {lot.inspectionResult.toUpperCase()}
          </p>
        </div>
      </div>
      {lot.gradeNote && lot.inspectionResult === "failed" && (
        <p className="text-sm text-destructive">
          ⚠ Inspection failed or material grade mismatch: {lot.gradeNote}
        </p>
      )}
    </div>
  );
}
