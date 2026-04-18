import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ListTree,
  Grid3x3,
  Columns2,
  Database,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  ArrowRight,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { dispatchCanvasSummary } from "./ai-blocks/aiEvents";
import SuggestionCard, { type SuggestionCardProps } from "./ai-blocks/SuggestionCard";

type Layout = "outline" | "risk" | "comparison" | "extracted";

const LAYOUT_TABS: { id: Layout; label: string; icon: typeof ListTree }[] = [
  { id: "outline", label: "Document outline", icon: ListTree },
  { id: "risk", label: "Risk matrix", icon: Grid3x3 },
  { id: "comparison", label: "Comparison", icon: Columns2 },
  { id: "extracted", label: "Extracted data", icon: Database },
];

type OutlineNode = { id: string; label: string; kind: "party" | "clause"; status: "idle" | "generating" | "done" };

const SEED_OUTLINE: OutlineNode[] = [
  { id: "p1", label: "Discloser", kind: "party", status: "idle" },
  { id: "p2", label: "Recipient", kind: "party", status: "idle" },
  { id: "c1", label: "Definitions", kind: "clause", status: "idle" },
  { id: "c2", label: "Confidential Information", kind: "clause", status: "idle" },
  { id: "c3", label: "Obligations", kind: "clause", status: "idle" },
  { id: "c4", label: "Term", kind: "clause", status: "idle" },
  { id: "c5", label: "Return of Materials", kind: "clause", status: "idle" },
  { id: "c6", label: "Governing Law", kind: "clause", status: "idle" },
];

const REVIEW_CARDS: (SuggestionCardProps & { id: string; category: string })[] = [
  {
    id: "rc1",
    severity: "Critical",
    category: "Payment",
    title: "Late payment interest above playbook ceiling",
    citation: "§3 Payment Terms",
    oldText: "1.5% per month",
    newText: "1% per month",
    reasoning: "Vendor MSA Playbook caps late-payment interest at 1% per month.",
  },
  {
    id: "rc2",
    severity: "Medium",
    category: "Payment",
    title: "Payment window shorter than standard",
    citation: "§3 Payment Terms",
    oldText: "fifteen (15) days",
    newText: "thirty (30) days",
    reasoning: "Market norm for B2B services is NET-30.",
  },
  {
    id: "rc3",
    severity: "Medium",
    category: "Term",
    title: "Auto-renewal not flagged",
    citation: "§5 Termination",
    newText: "Add explicit notice on auto-renewal at least 60 days prior.",
    reasoning: "Renewal terms should be highlighted and require advance notice.",
  },
  {
    id: "rc4",
    severity: "Low",
    category: "Boilerplate",
    title: "Missing governing law",
    citation: "§ End of document",
    newText:
      "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
    reasoning: "Adding an explicit governing-law clause prevents jurisdictional disputes.",
  },
];

const SEVERITIES = ["Critical", "Medium", "Low", "Info"] as const;
const CATEGORIES = ["Payment", "Term", "Liability", "Boilerplate"];

const SEV_DOT: Record<string, string> = {
  Critical: "bg-destructive",
  Medium: "bg-amber-500",
  Low: "bg-sky-500",
  Info: "bg-muted-foreground",
};

const COMPARISON_ROWS = [
  { term: "Payment terms", yours: "NET-15", theirs: "NET-30 (market)", diverges: true },
  { term: "Late-payment interest", yours: "1.5% / month", theirs: "1% / month (playbook)", diverges: true },
  { term: "Contract value", yours: "[Contract.Value]", theirs: "$50k–$250k (typical)", diverges: false },
  { term: "Term", yours: "12 months", theirs: "12 months", diverges: false },
  { term: "Governing law", yours: "Not specified", theirs: "State of Delaware", diverges: true },
];

const EXTRACTED = {
  parties: [
    { value: "[Client.Name]", source: "Recital, p.1" },
    { value: "[Sender.Company]", source: "Recital, p.1" },
  ],
  dates: [{ value: "[Effective.Date]", source: "Header, p.1" }],
  amounts: [{ value: "[Contract.Value]", source: "§3 Payment Terms" }],
  definedTerms: [
    { value: "Services", source: "§1 Definitions" },
    { value: "Deliverables", source: "§1 Definitions" },
  ],
};

interface AICanvasOverlayProps {
  open: boolean;
  initialLayout?: Layout;
  onClose: () => void;
}

const AICanvasOverlay = ({ open, initialLayout = "outline", onClose }: AICanvasOverlayProps) => {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [outline, setOutline] = useState<OutlineNode[]>(SEED_OUTLINE);
  const [generating, setGenerating] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setLayout(initialLayout);
  }, [open, initialLayout]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, layout, outline]);

  const handleClose = () => {
    // Drop a summary into chat
    let label = "";
    if (layout === "outline") {
      const total = outline.length;
      const done = outline.filter((n) => n.status === "done").length;
      label = `Document outline — ${total} sections${done ? `, ${done} drafted` : ""}`;
    } else if (layout === "risk") {
      label = `Risk matrix — ${REVIEW_CARDS.length} issues mapped`;
    } else if (layout === "comparison") {
      const div = COMPARISON_ROWS.filter((r) => r.diverges).length;
      label = `Comparison — ${div} of ${COMPARISON_ROWS.length} terms diverge from playbook`;
    } else {
      const total =
        EXTRACTED.parties.length +
        EXTRACTED.dates.length +
        EXTRACTED.amounts.length +
        EXTRACTED.definedTerms.length;
      label = `Extracted data — ${total} items pulled from the document`;
    }
    dispatchCanvasSummary({ layout, label });
    onClose();
  };

  const generateOutline = () => {
    setGenerating(true);
    let i = 0;
    const tick = () => {
      if (i >= outline.length) {
        setGenerating(false);
        toast.success("Outline streamed into the editor");
        return;
      }
      setOutline((prev) =>
        prev.map((n, idx) =>
          idx === i ? { ...n, status: "generating" } : idx < i ? { ...n, status: "done" } : n
        )
      );
      setTimeout(() => {
        setOutline((prev) => prev.map((n, idx) => (idx === i ? { ...n, status: "done" } : n)));
        i += 1;
        setTimeout(tick, 400);
      }, 600);
    };
    tick();
  };

  const moveOutline = (id: string, dir: -1 | 1) => {
    setOutline((prev) => {
      const i = prev.findIndex((n) => n.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addOutline = () => {
    setOutline((prev) => [
      ...prev,
      { id: `n${Date.now()}`, label: "New clause", kind: "clause", status: "idle" },
    ]);
  };

  const removeOutline = (id: string) => setOutline((prev) => prev.filter((n) => n.id !== id));

  const renameOutline = (id: string, label: string) =>
    setOutline((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));

  const selectedRisk = useMemo(
    () => REVIEW_CARDS.find((c) => c.id === selectedRiskId) ?? null,
    [selectedRiskId]
  );

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      {/* Canvas */}
      <div
        className="relative bg-card text-foreground rounded-2xl shadow-2xl border flex flex-col animate-scale-in overflow-hidden"
        style={{ width: "80vw", height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-semibold">Signit AI · Canvas</span>
          </div>
          {/* Segmented control */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/60">
            {LAYOUT_TABS.map((t) => {
              const Icon = t.icon;
              const active = layout === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setLayout(t.id);
                    setSelectedRiskId(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={12} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose} title="Close">
            <X size={14} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {layout === "outline" && (
            <div className="h-full flex">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold">Outline · NDA Draft</h2>
                      <p className="text-xs text-muted-foreground">
                        Drag to reorder. Generate streams content into the editor behind this canvas.
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addOutline}>
                        <Plus size={12} className="mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={generateOutline}
                        disabled={generating}
                      >
                        <Sparkles size={12} className="mr-1" />
                        {generating ? "Generating…" : "Generate"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <OutlineGroup
                      title="Parties"
                      nodes={outline.filter((n) => n.kind === "party")}
                      onMove={moveOutline}
                      onRename={renameOutline}
                      onRemove={removeOutline}
                    />
                    <OutlineGroup
                      title="Clauses"
                      nodes={outline.filter((n) => n.kind === "clause")}
                      onMove={moveOutline}
                      onRename={renameOutline}
                      onRemove={removeOutline}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {layout === "risk" && (
            <div className="h-full flex">
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-3">
                  <h2 className="text-base font-semibold">Risk matrix</h2>
                  <p className="text-xs text-muted-foreground">
                    Severity × Category. Click a dot to open the suggestion.
                  </p>
                </div>
                <div className="rounded-xl border overflow-hidden">
                  <div className="grid" style={{ gridTemplateColumns: `120px repeat(${CATEGORIES.length}, 1fr)` }}>
                    {/* Header row */}
                    <div className="bg-muted/40 border-b border-r px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                      Severity
                    </div>
                    {CATEGORIES.map((c) => (
                      <div
                        key={c}
                        className="bg-muted/40 border-b px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground"
                      >
                        {c}
                      </div>
                    ))}
                    {SEVERITIES.map((sev) => (
                      <RiskRow
                        key={sev}
                        severity={sev}
                        cards={REVIEW_CARDS.filter((c) => c.severity === sev)}
                        categories={CATEGORIES}
                        onPick={setSelectedRiskId}
                        selectedId={selectedRiskId}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Right rail */}
              <div className="w-[340px] border-l bg-muted/20 overflow-y-auto p-4">
                {selectedRisk ? (
                  <SuggestionCard {...selectedRisk} />
                ) : (
                  <div className="text-center pt-12">
                    <Grid3x3 size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                    <div className="text-xs font-medium text-foreground">Pick a dot</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Click any plotted issue to inspect it here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {layout === "comparison" && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-base font-semibold mb-1">Comparison</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Your document vs. the active playbook & market norms.
                </p>
                <div className="grid grid-cols-[160px_1fr_1fr] rounded-xl border overflow-hidden text-sm">
                  <div className="bg-muted/40 border-b border-r px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                    Term
                  </div>
                  <div className="bg-muted/40 border-b border-r px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                    Your document
                  </div>
                  <div className="bg-muted/40 border-b px-3 py-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                    Playbook / Market
                  </div>
                  {COMPARISON_ROWS.map((r, i) => (
                    <div key={r.term} className="contents">
                      <div className={cn("border-r px-3 py-2.5 text-foreground/80", i < COMPARISON_ROWS.length - 1 && "border-b")}>
                        {r.term}
                      </div>
                      <div
                        className={cn(
                          "border-r px-3 py-2.5",
                          r.diverges
                            ? "bg-destructive/5 text-destructive"
                            : "text-foreground/80",
                          i < COMPARISON_ROWS.length - 1 && "border-b"
                        )}
                      >
                        {r.yours}
                      </div>
                      <div
                        className={cn(
                          "px-3 py-2.5 text-foreground/80",
                          i < COMPARISON_ROWS.length - 1 && "border-b"
                        )}
                      >
                        {r.theirs}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {layout === "extracted" && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-5">
                <div>
                  <h2 className="text-base font-semibold">Extracted data</h2>
                  <p className="text-xs text-muted-foreground">
                    All structured values pulled from the document.
                  </p>
                </div>
                <ExtractedTable title="Parties" rows={EXTRACTED.parties} onJump={handleClose} />
                <ExtractedTable title="Dates" rows={EXTRACTED.dates} onJump={handleClose} />
                <ExtractedTable title="Amounts" rows={EXTRACTED.amounts} onJump={handleClose} />
                <ExtractedTable title="Defined terms" rows={EXTRACTED.definedTerms} onJump={handleClose} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

/* ── Subcomponents ── */

const OutlineGroup = ({
  title,
  nodes,
  onMove,
  onRename,
  onRemove,
}: {
  title: string;
  nodes: OutlineNode[];
  onMove: (id: string, dir: -1 | 1) => void;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="rounded-xl border bg-background/60 overflow-hidden">
    <div className="px-3 py-2 border-b text-[10px] uppercase tracking-wide font-medium text-muted-foreground bg-muted/30">
      {title}
    </div>
    <div className="divide-y">
      {nodes.map((n) => (
        <div key={n.id} className="flex items-center gap-2 px-2 py-1.5 group">
          <button
            className="text-muted-foreground/60 hover:text-foreground cursor-grab"
            title="Drag to reorder"
            onClick={() => onMove(n.id, -1)}
          >
            <GripVertical size={14} />
          </button>
          <span
            className={cn(
              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
              n.status === "done"
                ? "bg-emerald-500 border-emerald-500"
                : n.status === "generating"
                ? "border-primary animate-pulse"
                : "border-muted-foreground/40"
            )}
          >
            {n.status === "done" && <Check size={10} className="text-primary-foreground" />}
          </span>
          <input
            value={n.label}
            onChange={(e) => onRename(n.id, e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm py-0.5 focus:bg-muted/40 rounded px-1"
          />
          <button
            onClick={() => onRemove(n.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const RiskRow = ({
  severity,
  cards,
  categories,
  onPick,
  selectedId,
}: {
  severity: string;
  cards: (SuggestionCardProps & { id: string; category: string })[];
  categories: string[];
  onPick: (id: string) => void;
  selectedId: string | null;
}) => (
  <>
    <div className="border-r border-b px-3 py-4 flex items-center gap-1.5 bg-muted/10">
      <span className={cn("inline-block w-2 h-2 rounded-full", SEV_DOT[severity])} />
      <span className="text-xs font-medium">{severity}</span>
    </div>
    {categories.map((cat) => {
      const inCell = cards.filter((c) => c.category === cat);
      return (
        <div
          key={cat}
          className="border-b px-3 py-4 flex flex-wrap gap-1.5 items-center min-h-[56px]"
        >
          {inCell.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              title={c.title}
              className={cn(
                "w-3.5 h-3.5 rounded-full transition-all hover:scale-125",
                SEV_DOT[severity],
                selectedId === c.id && "ring-2 ring-offset-2 ring-primary ring-offset-background scale-125"
              )}
            />
          ))}
        </div>
      );
    })}
  </>
);

const ExtractedTable = ({
  title,
  rows,
  onJump,
}: {
  title: string;
  rows: { value: string; source: string }[];
  onJump: () => void;
}) => (
  <div className="rounded-xl border overflow-hidden">
    <div className="px-3 py-2 border-b text-[10px] uppercase tracking-wide font-medium text-muted-foreground bg-muted/30 flex items-center justify-between">
      <span>{title}</span>
      <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70">{rows.length}</span>
    </div>
    <div className="divide-y">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2">
          <div className="font-mono text-xs text-foreground">{r.value}</div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">{r.source}</span>
            <button
              onClick={() => {
                onJump();
                toast(`Jumping to ${r.source}`);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              Jump to source
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AICanvasOverlay;
