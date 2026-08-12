import { getLots, getSuppliers } from "@/lib/traceability";
import type { BuildRecord } from "@/lib/types";

interface GenealogyTreeProps {
  builds: BuildRecord[];
}

export function GenealogyTree({ builds }: GenealogyTreeProps) {
  if (builds.length === 0) return null;

  const lots = getLots();
  const suppliers = getSuppliers();
  const lotNumbers = Array.from(new Set(builds.flatMap((b) => b.lotsConsumed)));

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Genealogy</p>
      <div className="flex flex-wrap items-start gap-4">
        {lotNumbers.map((lotNumber) => {
          const lot = lots.find((l) => l.lotNumber === lotNumber);
          const supplier = lot ? suppliers.find((s) => s.id === lot.supplierId) : undefined;
          const consumingBuilds = builds.filter((b) => b.lotsConsumed.includes(lotNumber));

          return (
            <div key={lotNumber} className="flex items-center gap-2">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <p className="font-medium">{supplier?.name ?? "Unknown supplier"}</p>
                <p className="text-muted-foreground">supplier</p>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <p className="font-medium">{lotNumber}</p>
                <p className="text-muted-foreground">lot</p>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div className="flex flex-col gap-1">
                {consumingBuilds.map((b) => (
                  <div key={b.serial} className="rounded-md border bg-primary-50 px-3 py-2 text-xs">
                    <p className="font-medium">{b.serial}</p>
                    <p className="text-muted-foreground">serial</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
