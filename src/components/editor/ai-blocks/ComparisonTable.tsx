import { cn } from "@/lib/utils";

export type RowChip = "Above market" | "Below market" | "Matches playbook" | "Risk" | "OK";

const CHIP_STYLES: Record<RowChip, string> = {
  "Above market": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Below market": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Matches playbook": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Risk": "bg-destructive/10 text-destructive",
  "OK": "bg-muted text-muted-foreground",
};

export interface ComparisonRow {
  cells: React.ReactNode[];
  chip?: RowChip;
}

export interface ComparisonTableProps {
  headers: string[];
  rows: ComparisonRow[];
  caption?: string;
}

const ComparisonTable = ({ headers, rows, caption }: ComparisonTableProps) => (
  <div className="rounded-xl border bg-background/60 mt-2 overflow-hidden">
    {caption && (
      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground border-b">
        {caption}
      </div>
    )}
    <table className="w-full text-[11px]">
      <thead>
        <tr className="bg-muted/40">
          {headers.map((h, i) => (
            <th
              key={i}
              className="text-left font-semibold text-foreground px-2.5 py-1.5 first:pl-3 last:pr-3"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={cn("border-t border-border/60", ri % 2 === 1 && "bg-muted/20")}>
            {row.cells.map((cell, ci) => (
              <td
                key={ci}
                className="px-2.5 py-1.5 text-foreground/90 first:pl-3 last:pr-3 align-top"
              >
                {cell}
                {ci === row.cells.length - 1 && row.chip && (
                  <span
                    className={cn(
                      "ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                      CHIP_STYLES[row.chip]
                    )}
                  >
                    {row.chip}
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ComparisonTable;
