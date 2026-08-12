"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getBuildRecords, getLots, searchTrace } from "@/lib/traceability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuildRecordCard } from "@/components/dashboard/traceability/build-record-card";
import { LotRecordCard } from "@/components/dashboard/traceability/lot-record-card";
import { GenealogyTree } from "@/components/dashboard/traceability/genealogy-tree";

interface TraceSearchProps {
  initialQuery?: string;
}

function sampleHints(): string[] {
  const builds = getBuildRecords();
  const lots = getLots();
  const clean = builds.find((b) => b.qcResult === "pass");
  const conditional = builds.find((b) => b.qcResult === "conditional");
  const suspectLot = lots.find((l) => l.inspectionResult === "failed");
  return [
    clean ? `${clean.serial} (clean)` : "",
    conditional ? `${conditional.serial} (deviation)` : "",
    suspectLot ? `${suspectLot.lotNumber} (suspect lot)` : "",
  ].filter((hint) => hint !== "");
}

export function TraceSearch({ initialQuery = "" }: TraceSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [showGenealogy, setShowGenealogy] = useState(false);
  const hints = useMemo(() => sampleHints(), []);

  const result = useMemo(
    () => (submittedQuery ? searchTrace(submittedQuery) : { builds: [] }),
    [submittedQuery]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  function handleSelectLot(lotNumber: string) {
    setQuery(lotNumber);
    setSubmittedQuery(lotNumber);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by serial number, lot number, or order name..."
        />
        <Button type="submit">Search</Button>
      </form>

      {hints.length > 0 && <p className="text-xs text-muted-foreground">Try: {hints.join(" · ")}</p>}

      {submittedQuery && result.builds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No trace records found for &ldquo;{submittedQuery}&rdquo;.
        </p>
      )}

      {result.lot && <LotRecordCard lot={result.lot} supplier={result.supplier} />}

      {result.builds.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {result.builds.length} build{result.builds.length > 1 ? "s" : ""} found
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowGenealogy((v) => !v)}>
            {showGenealogy ? "Hide" : "Show"} genealogy
          </Button>
        </div>
      )}

      {showGenealogy && <GenealogyTree builds={result.builds} />}

      <div className="space-y-4">
        {result.builds.map((build) => (
          <BuildRecordCard key={build.serial} build={build} onSelectLot={handleSelectLot} />
        ))}
      </div>
    </div>
  );
}
