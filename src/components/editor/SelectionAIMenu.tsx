import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, MessageSquare, Wand2, Minimize2, ShieldCheck, Info, Columns2 } from "lucide-react";
import { useEditorContext } from "./EditorContext";
import { dispatchAiUserAction } from "./ai-blocks/aiEvents";

interface Action {
  id: string;
  label: string;
  icon: typeof Sparkles;
  kind: string;
}

const ACTIONS: Action[] = [
  { id: "ask", label: "Ask AI", icon: MessageSquare, kind: "ask" },
  { id: "rewrite", label: "Rewrite", icon: Wand2, kind: "rewrite" },
  { id: "shorten", label: "Shorten", icon: Minimize2, kind: "shorten" },
  { id: "stricter", label: "Make stricter", icon: ShieldCheck, kind: "make-stricter" },
  { id: "explain", label: "Explain", icon: Info, kind: "explain" },
  { id: "compare", label: "Compare to playbook", icon: Columns2, kind: "compare-playbook" },
];

const SelectionAIMenu = () => {
  const { requestOpenAiPanel } = useEditorContext();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setPos(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 4) {
        setPos(null);
        return;
      }
      // Only inside editor canvas
      const range = sel.getRangeAt(0);
      const ancestor = range.commonAncestorContainer as HTMLElement;
      const host =
        document.querySelector<HTMLElement>("[data-editor-canvas-host]") ||
        document.querySelector<HTMLElement>("main");
      if (!host) return;
      const el =
        ancestor.nodeType === 1
          ? (ancestor as HTMLElement)
          : (ancestor.parentElement as HTMLElement | null);
      if (!el || !host.contains(el)) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setSelectedText(text);
      setPos({
        top: rect.top - 44,
        left: rect.left + rect.width / 2,
      });
    };

    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  if (!pos || !selectedText) return null;

  const trigger = (action: Action) => {
    requestOpenAiPanel();
    const promptMap: Record<string, string> = {
      ask: "What does this clause mean?",
      rewrite: "Rewrite this for me.",
      shorten: "Shorten this.",
      "make-stricter": "Make this stricter.",
      explain: "Explain this clause.",
      "compare-playbook": "Compare this clause to the playbook.",
    };
    dispatchAiUserAction({
      intent: "Selection",
      prompt: promptMap[action.kind] || action.label,
      selectedText,
      kind: action.kind,
    });
    // Clear native selection so the bar dismisses
    window.getSelection()?.removeAllRanges();
    setPos(null);
  };

  return createPortal(
    <div
      className="fixed z-[90] -translate-x-1/2 rounded-full border bg-popover shadow-lg flex items-center gap-0.5 px-1 py-1 animate-fade-in"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault() /* keep selection */}
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            onClick={() => trigger(a)}
            className="inline-flex items-center gap-1 px-2 h-7 rounded-full text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
            title={a.label}
          >
            <Icon size={12} className="text-primary" />
            <span>{a.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
};

export default SelectionAIMenu;
