import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, FileText, ArrowRight, BookOpen, Type, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import { dispatchAiUserAction } from "./ai-blocks/aiEvents";
import { toast } from "sonner";

interface SlashOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  needsInput?: boolean;
  inputPlaceholder?: string;
  kind: string;
}

const OPTIONS: SlashOption[] = [
  {
    id: "draft-clause",
    label: "Draft clause",
    description: "Write a brand new clause from a short brief",
    icon: FileText,
    needsInput: true,
    inputPlaceholder: "e.g. governing law, Saudi Arabia",
    kind: "draft-clause",
  },
  {
    id: "continue",
    label: "Continue writing",
    description: "Pick up where you left off in this document",
    icon: ArrowRight,
    kind: "continue",
  },
  {
    id: "playbook",
    label: "Insert from playbook",
    description: "Drop a pre-approved clause from your active playbook",
    icon: BookOpen,
    kind: "insert-playbook",
  },
  {
    id: "summarize-above",
    label: "Summarize above",
    description: "Add a one-paragraph summary of the prior section",
    icon: ListOrdered,
    kind: "summarize-above",
  },
  {
    id: "defined-term",
    label: "Add defined term",
    description: "Define a term used elsewhere in the document",
    icon: Type,
    needsInput: true,
    inputPlaceholder: "e.g. Confidential Information",
    kind: "defined-term",
  },
];

const MOCK_DRAFTS: Record<string, (input: string) => string> = {
  "draft-clause": (input) =>
    input.toLowerCase().includes("saudi")
      ? "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. The parties consent to the exclusive jurisdiction of the courts of Riyadh for any dispute arising hereunder."
      : `New Clause. ${input}. The parties agree to be bound by the terms set forth in this section.`,
  continue: () =>
    "Furthermore, each party shall use commercially reasonable efforts to perform its obligations in a timely manner and in accordance with industry best practices.",
  "insert-playbook": () =>
    "Confidentiality. Each party shall hold in strict confidence all non-public information disclosed by the other party and shall use such information solely for the purposes of this Agreement.",
  "summarize-above": () =>
    "In summary: this section establishes the scope of work, the governing payment terms, and the parties' respective obligations during the term of the Agreement.",
  "defined-term": (input) =>
    `"${input || "Term"}" means any information, materials, or data designated as such by the disclosing party, whether in written, oral, or electronic form.`,
};

interface PendingInsertion {
  id: string;
  text: string;
  optionLabel: string;
}

const EditorSlashMenu = () => {
  const { requestOpenAiPanel } = useEditorContext();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [stage, setStage] = useState<"menu" | "input">("menu");
  const [activeOption, setActiveOption] = useState<SlashOption | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingInsertions, setPendingInsertions] = useState<PendingInsertion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for "/" keypress within the editor canvas area
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "/") return;

      // Detect editor canvas focus / pointer within
      const canvas = document.querySelector<HTMLElement>("[data-editor-canvas-host]") ||
        document.querySelector<HTMLElement>(".editor-canvas, main");
      if (!canvas) return;
      const target = e.target as HTMLElement | null;
      const inCanvas =
        target && (canvas.contains(target) || target === document.body || target.tagName === "BODY");
      if (!inCanvas) return;

      // Don't hijack typing inside form inputs / textareas / contenteditable
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Position near the top of the canvas (mock — caret position not tracked)
      setPosition({
        top: Math.min(rect.top + 80, window.innerHeight - 380),
        left: rect.left + 60,
      });
      setStage("menu");
      setActiveOption(null);
      setInputValue("");
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && stage === "input") setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, stage]);

  const handlePickOption = (opt: SlashOption) => {
    if (opt.needsInput) {
      setActiveOption(opt);
      setStage("input");
      return;
    }
    runOption(opt, "");
  };

  const runOption = (opt: SlashOption, input: string) => {
    setOpen(false);
    const text = MOCK_DRAFTS[opt.kind]?.(input) || "Drafted content.";
    streamInsertion(opt, text, input);
  };

  // Stream a pending insertion into the editor canvas
  const streamInsertion = (opt: SlashOption, fullText: string, input: string) => {
    const host =
      document.querySelector<HTMLElement>("[data-editor-canvas-host]") ||
      document.querySelector<HTMLElement>("main");
    if (!host) {
      toast.error("Editor canvas not found");
      return;
    }
    const id = `slash-${Date.now()}`;
    const wrapper = document.createElement("div");
    wrapper.dataset.slashInsertion = id;
    wrapper.style.margin = "12px 0";
    wrapper.style.padding = "10px 12px";
    wrapper.style.borderRadius = "10px";
    wrapper.style.border = "1px solid hsl(var(--primary) / 0.35)";
    wrapper.style.background = "hsl(var(--primary) / 0.07)";
    wrapper.style.transition = "background-color 250ms ease, opacity 250ms ease";

    const tag = document.createElement("div");
    tag.style.display = "flex";
    tag.style.alignItems = "center";
    tag.style.gap = "6px";
    tag.style.fontSize = "10px";
    tag.style.fontWeight = "600";
    tag.style.textTransform = "uppercase";
    tag.style.letterSpacing = "0.05em";
    tag.style.color = "hsl(var(--primary))";
    tag.style.marginBottom = "4px";
    tag.textContent = `✨ AI · ${opt.label}`;

    const body = document.createElement("p");
    body.style.fontSize = "14px";
    body.style.lineHeight = "1.55";
    body.style.color = "hsl(var(--foreground))";
    body.style.margin = "0";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "6px";
    actions.style.marginTop = "8px";

    const mkBtn = (label: string, primary = false) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.padding = "3px 10px";
      b.style.borderRadius = "6px";
      b.style.fontSize = "11px";
      b.style.fontWeight = "500";
      b.style.cursor = "pointer";
      b.style.border = primary ? "none" : "1px solid hsl(var(--border))";
      b.style.background = primary ? "hsl(var(--primary))" : "transparent";
      b.style.color = primary ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))";
      return b;
    };
    const acceptBtn = mkBtn("Accept", true);
    const rejectBtn = mkBtn("Reject");
    const reviseBtn = mkBtn("Revise");

    acceptBtn.onclick = () => {
      // Replace the pending block with plain accepted text
      const accepted = document.createElement("p");
      accepted.style.fontSize = "14px";
      accepted.style.lineHeight = "1.55";
      accepted.style.color = "hsl(var(--foreground))";
      accepted.style.margin = "12px 0";
      accepted.textContent = body.textContent || "";
      wrapper.replaceWith(accepted);
      toast.success("AI insertion accepted");
      setPendingInsertions((p) => p.filter((x) => x.id !== id));
    };
    rejectBtn.onclick = () => {
      wrapper.style.opacity = "0";
      setTimeout(() => wrapper.remove(), 250);
      toast("Rejected");
      setPendingInsertions((p) => p.filter((x) => x.id !== id));
    };
    reviseBtn.onclick = () => {
      requestOpenAiPanel();
      dispatchAiUserAction({
        intent: "Slash",
        prompt: `Revise this AI insertion: ${(body.textContent || "").slice(0, 120)}…`,
      });
    };

    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    actions.appendChild(reviseBtn);

    wrapper.appendChild(tag);
    wrapper.appendChild(body);
    wrapper.appendChild(actions);

    // Append at top of canvas so it's visible
    host.appendChild(wrapper);
    wrapper.scrollIntoView({ behavior: "smooth", block: "center" });

    // Stream the text
    let i = 0;
    const interval = setInterval(() => {
      i += 4;
      body.textContent = fullText.slice(0, Math.min(i, fullText.length));
      if (i >= fullText.length) {
        clearInterval(interval);
        // Post a unified chat message
        requestOpenAiPanel();
        dispatchAiUserAction({
          intent: "Slash",
          prompt: input ? `${opt.label} — ${input}` : opt.label,
          kind: opt.kind,
          payload: { input, draft: fullText },
        });
      }
    }, 22);

    setPendingInsertions((p) => [...p, { id, text: fullText, optionLabel: opt.label }]);
  };

  if (!open || !position) return null;

  return createPortal(
    <>
      {/* Click outside */}
      <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[81] w-[300px] rounded-xl border bg-popover shadow-lg overflow-hidden animate-fade-in"
        style={{ top: position.top, left: position.left }}
      >
        <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {stage === "menu" ? "AI actions" : activeOption?.label}
          </span>
        </div>

        {stage === "menu" ? (
          <div className="py-1 max-h-[320px] overflow-y-auto">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handlePickOption(opt)}
                  className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                >
                  <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && activeOption) runOption(activeOption, inputValue.trim());
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={activeOption?.inputPlaceholder}
              className={cn(
                "w-full h-9 px-2.5 text-sm rounded-md bg-background border border-border",
                "outline-none focus:ring-2 focus:ring-ring"
              )}
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setOpen(false)}
                className="px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => activeOption && runOption(activeOption, inputValue.trim())}
                disabled={!inputValue.trim()}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

export default EditorSlashMenu;
