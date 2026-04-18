import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Send,
  Sparkles,
  X,
  Maximize2,
  History,
  ChevronDown,
  Check,
  MessageSquare,
  ShieldAlert,
  ExternalLink,
  Bookmark,
  Undo2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AiIcon from "@/components/AiIcon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import type { AiSuggestion, Comment } from "./EditorContext";
import SuggestionCard, { type SuggestionCardProps } from "./ai-blocks/SuggestionCard";
import ComparisonTable, { type ComparisonTableProps } from "./ai-blocks/ComparisonTable";
import Checklist, { type ChecklistProps } from "./ai-blocks/Checklist";
import CitationPill from "./ai-blocks/CitationPill";

import ReviewSetupCard, { type ReviewSetup } from "./ai-blocks/ReviewSetupCard";
import { addMarginPin, removeMarginPin, applyEditToCanvas } from "./ai-blocks/aiBlockUtils";
import AICanvasOverlay from "./AICanvasOverlay";
import { AI_EVENTS, type AiUserAction, type AiCanvasSummary } from "./ai-blocks/aiEvents";

const EDIT_KEYWORDS = [
  "change", "rewrite", "update", "modify", "add a clause",
  "remove", "rephrase", "replace", "insert", "edit",
  "revise", "add a section", "delete", "draft",
];

const INTENT_CHIPS = ["Ask", "Draft", "Review", "Use playbook", "Summarize"] as const;
type Intent = (typeof INTENT_CHIPS)[number];

type Scope = "Full document" | "Selected text" | "Current section";
const SCOPES: Scope[] = ["Full document", "Selected text", "Current section"];

const PLAYBOOKS = [
  { id: "vendor-msa", name: "Vendor MSA Playbook" },
  { id: "nda-redlines", name: "NDA Redlines" },
  { id: "my-playbook", name: "My Playbook" },
];

type SuggestionBlockData = SuggestionCardProps & {
  cardId: string;
  resolved?: "applied" | "dismissed";
  resolvedLabel?: string;
};

type RichBlock =
  | ({ kind: "suggestion" } & SuggestionBlockData)
  | ({ kind: "table" } & ComparisonTableProps)
  | ({ kind: "checklist" } & ChecklistProps)
  | { kind: "setup"; setupId: string }
  | { kind: "status"; label: string }
  | { kind: "completion"; criticalCount: number }
  | { kind: "canvas-link"; layout: "outline" | "risk" | "comparison" | "extracted"; label: string };

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: Intent;
  scope?: Scope;
  selectedText?: string;
  hasSuggestions?: boolean;
  blocks?: RichBlock[];
}

interface HistoryItem {
  id: string;
  title: string;
  date: Date;
  preview: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: "h1", title: "Termination clause review", date: new Date(), preview: "Suggested 60-day notice…" },
  { id: "h2", title: "Pricing summary", date: new Date(), preview: "Annual cap at 5%…" },
  { id: "h3", title: "Data protection redlines", date: new Date(Date.now() - 86400000), preview: "Added GDPR clause…" },
  { id: "h4", title: "Liability cap question", date: new Date(Date.now() - 86400000 * 3), preview: "Capped at 12 months fees…" },
  { id: "h5", title: "Initial document summary", date: new Date(Date.now() - 86400000 * 7), preview: "MSA with 4 schedules…" },
];

const MOCK_AI_RESPONSES: Record<string, string> = {
  default: "Based on this document, the clause establishes standard terms for the agreement. The language is fairly typical. Want me to suggest modifications or clarify specific aspects?",
  termination: "This termination clause allows either party to end the agreement with 30 days written notice. Consider adding immediate-termination triggers like material breach or insolvency.",
  payment: "Payment terms specify NET-30 from invoice date — standard for B2B. You may want to add late payment penalties or early payment discounts.",
  liability: "The liability cap is set at 12 months of fees paid. Common, but verify it fits your risk tolerance and applicable law.",
  summarize: "This is a Master Services Agreement between two parties covering scope of services, fees, IP ownership, confidentiality, and termination. Initial term is 24 months with auto-renewal.",
};

interface EditorAIPanelProps {
  docType?: string;
  onClose?: () => void;
}

const formatHistoryGroup = (date: Date) => {
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Earlier";
};

const EditorAIPanel = ({ docType = "", onClose }: EditorAIPanelProps) => {
  const { pendingAiQuestion, setPendingAiQuestion, aiSuggestions, setAiSuggestions, setComments } =
    useEditorContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null);
  const [scope, setScope] = useState<Scope>("Full document");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activePlaybooks, setActivePlaybooks] = useState<string[]>(["vendor-msa", "my-playbook"]);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasInitialLayout, setCanvasInitialLayout] = useState<AiCanvasSummary["layout"]>("outline");
  const [setups, setSetups] = useState<Record<string, ReviewSetup>>({});
  const [reviewRuns, setReviewRuns] = useState<Record<string, "idle" | "running" | "done">>({});
  const [hasResolvedAny, setHasResolvedAny] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "violations">("chat");
  const [resolvedViolations, setResolvedViolations] = useState<string[]>([]);
  // Save-rule prompts shown as lightweight in-panel toasts
  type SaveRulePrompt = {
    id: string;
    suggestedName: string;
    stage: "ask" | "form" | "saved";
    ruleName?: string;
    savedTo?: string;
  };
  const [savePrompts, setSavePrompts] = useState<SaveRulePrompt[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pendingSuggestions = aiSuggestions.filter((s) => s.status === "pending");
  const primaryPlaybookName =
    PLAYBOOKS.find((p) => p.id === activePlaybooks[0])?.name ?? "No playbook";

  // Auto-switch scope when text is selected via Ask AI
  useEffect(() => {
    if (pendingAiQuestion) {
      setQuotedText(pendingAiQuestion.selectedText || null);
      if (pendingAiQuestion.selectedText) setScope("Selected text");
      setInput(pendingAiQuestion.question || "");
      setPendingAiQuestion(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingAiQuestion, setPendingAiQuestion]);

  // Listen for slash/selection actions and canvas summaries (cross-surface bus)
  useEffect(() => {
    const onAction = (e: Event) => {
      const detail = (e as CustomEvent<AiUserAction>).detail;
      if (!detail) return;
      handleExternalAction(detail);
    };
    const onSummary = (e: Event) => {
      const s = (e as CustomEvent<AiCanvasSummary>).detail;
      if (!s) return;
      const id = `a-canvas-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          content: `Canvas: ${s.label} · `,
          blocks: [{ kind: "canvas-link", layout: s.layout, label: s.label }],
        },
      ]);
    };
    const onOpenCanvas = (e: Event) => {
      const detail = (e as CustomEvent<{ layout?: AiCanvasSummary["layout"] }>).detail;
      setCanvasInitialLayout(detail?.layout ?? "outline");
      setCanvasOpen(true);
    };
    window.addEventListener(AI_EVENTS.USER_ACTION, onAction);
    window.addEventListener(AI_EVENTS.CANVAS_SUMMARY, onSummary);
    window.addEventListener(AI_EVENTS.OPEN_CANVAS, onOpenCanvas);
    return () => {
      window.removeEventListener(AI_EVENTS.USER_ACTION, onAction);
      window.removeEventListener(AI_EVENTS.CANVAS_SUMMARY, onSummary);
      window.removeEventListener(AI_EVENTS.OPEN_CANVAS, onOpenCanvas);
    };
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const isEditRequest = (text: string, intent: Intent | null) => {
    if (intent === "Draft" || intent === "Review" || intent === "Use playbook") return true;
    const lower = text.toLowerCase();
    return EDIT_KEYWORDS.some((kw) => lower.includes(kw));
  };

  const pickResponseKey = (q: string) => {
    const l = q.toLowerCase();
    if (l.includes("summar")) return "summarize";
    if (l.includes("terminat")) return "termination";
    if (l.includes("pay")) return "payment";
    if (l.includes("liabil")) return "liability";
    return "default";
  };

  const streamAssistant = (msgId: string, fullText: string, opts?: Partial<ChatMessage>) => {
    let i = 0;
    setMessages((prev) => [
      ...prev,
      { id: msgId, role: "assistant", content: "", ...opts },
    ]);
    setIsStreaming(true);
    const interval = setInterval(() => {
      i += 3;
      const done = i >= fullText.length;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: done ? fullText : fullText.slice(0, i) } : m
        )
      );
      if (done) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 18);
  };

  const generateSuggestions = () => {
    const mockSuggestions: AiSuggestion[] = [
      {
        id: `ai-s-${Date.now()}-1`,
        type: "addition",
        sectionRef: "Section 2: Scope of Services",
        newText:
          "2.1 Data Protection. The Service Provider shall implement and maintain appropriate technical and organizational measures to ensure the security and confidentiality of all personal data processed in connection with the Services, in compliance with applicable data protection laws including GDPR.",
        status: "pending",
      },
      {
        id: `ai-s-${Date.now()}-2`,
        type: "replacement",
        sectionRef: "Section 5: Termination",
        oldText: "Either party may terminate this Agreement with thirty (30) days' prior written notice.",
        newText:
          "Either party may terminate this Agreement with sixty (60) days' prior written notice. In the event of a material breach, the non-breaching party may terminate immediately upon written notice.",
        status: "pending",
      },
    ];
    setAiSuggestions((prev) => [...prev, ...mockSuggestions]);
    mockSuggestions.forEach((s) => {
      const newComment: Comment = {
        id: `ai-c-${s.id}`,
        author: "AI Assistant",
        authorInitials: "AI",
        authorColor: "#7C3AED",
        text:
          s.type === "addition"
            ? "Suggested adding a new clause about data protection after this section"
            : "Suggested replacing the termination notice period",
        timestamp: new Date(),
        sectionRef: s.sectionRef,
        docId: "doc-1",
        status: "open",
        replies: [],
        type: "inline",
        annotationType: "ai_suggestion",
        suggestedText: s.newText,
      };
      setComments((prev) => [newComment, ...prev]);
    });
    return mockSuggestions.length;
  };

  // Handle a user action coming from slash menu / selection menu
  const handleExternalAction = (action: AiUserAction) => {
    const userId = `u-ext-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      content: action.prompt,
      intent: (action.intent as ChatMessage["intent"]) ?? undefined,
      selectedText: action.selectedText,
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiId = `a-ext-${Date.now()}`;
      const k = action.kind;

      // Selection → Make stricter → SuggestionCard
      if (k === "make-stricter") {
        const card: SuggestionBlockData = {
          cardId: `ext-card-${Date.now()}`,
          severity: "Medium",
          title: "Tighten payment-terms language",
          citation: "§3 Payment Terms",
          oldText: "Late payments may be subject to interest at 1.5% per month",
          newText: "Late payments must accrue interest at 1% per month, compounded monthly, until paid in full",
          reasoning: "Replaced permissive 'may' with mandatory 'must' and aligned the rate with your playbook.",
        };
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            role: "assistant",
            content: "Here's a stricter version of the selected clause:",
            blocks: [{ kind: "suggestion", ...card }],
          },
        ]);
        return;
      }

      // Selection → Compare to playbook → ComparisonTable
      if (k === "compare-playbook") {
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            role: "assistant",
            content: "Comparing the selected clause to your active playbook:",
            blocks: [
              {
                kind: "table",
                caption: "Selection vs Vendor MSA Playbook",
                headers: ["Aspect", "Your selection", "Playbook standard"],
                rows: [
                  { cells: ["Payment window", "NET-15", "NET-30"], chip: "Risk" },
                  { cells: ["Late interest", "1.5% / month", "1% / month"], chip: "Above market" },
                  { cells: ["Currency", "USD", "USD"], chip: "Matches playbook" },
                ],
              },
            ],
          },
        ]);
        return;
      }

      // Slash → Draft clause → confirmation message
      if (k === "draft-clause") {
        const input = (action.payload?.input as string) || "";
        const subject = input.toLowerCase().includes("saudi") ? "Saudi Arabia" : input || "the requested topic";
        streamAssistant(
          aiId,
          `Drafted a governing-law clause for ${subject}. Accept to insert into the document.`
        );
        return;
      }

      // Slash → other kinds → generic confirmation
      if (action.intent === "Slash") {
        streamAssistant(
          aiId,
          `Done — streamed the result into the editor as a pending insertion. Use Accept / Reject above the block.`
        );
        return;
      }

      // Selection generic actions (ask, rewrite, shorten, explain)
      const labelMap: Record<string, string> = {
        ask: "Here's what this clause means in plain English:",
        rewrite: "Here's a clearer rewrite:",
        shorten: "Here's a shorter version:",
        explain: "Plain-English explanation of the selected text:",
      };
      streamAssistant(
        aiId,
        `${labelMap[k || ""] || "Here's my take:"} the selected language is generally clear, but you could tighten the obligation by replacing soft modal verbs ("may", "should") with mandatory ones ("must", "shall"). See [§3 Payment Terms] for context.`
      );
    }, 200);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      intent: activeIntent ?? undefined,
      scope,
      selectedText: quotedText || undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setQuotedText(null);

    const intent = activeIntent;
    setActiveIntent(null);

    setTimeout(() => {
      const aiId = `a-${Date.now()}`;
      const lower = text.toLowerCase();

      // Seeded mock: Review intent → setup card
      if (intent === "Review" || lower.includes("review as client") || lower.includes("review")) {
        const setupId = `setup-${Date.now()}`;
        const initial: ReviewSetup = {
          perspective: "Client",
          scope: "Full document",
          playbook: "Vendor MSA Playbook",
          output: "Comments + redlines",
        };
        setSetups((prev) => ({ ...prev, [setupId]: initial }));
        setReviewRuns((prev) => ({ ...prev, [setupId]: "idle" }));
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            role: "assistant",
            content: "Here's the setup I detected — tweak anything before we begin.",
            blocks: [{ kind: "setup", setupId }],
          },
        ]);
        return;
      }

      // Seeded mock: Summarize this contract
      if (intent === "Summarize" || lower.includes("summari")) {
        const blocks: RichBlock[] = [
          {
            kind: "table",
            caption: "At a glance",
            headers: ["Field", "Value"],
            rows: [
              { cells: ["Term", "12 months"] },
              { cells: ["Value", "[Contract.Value]"] },
              { cells: ["Payment", "NET-15"], chip: "Below market" },
              { cells: ["Termination", "30 days notice"] },
              { cells: ["Governing law", "Not specified ⚠️"], chip: "Risk" },
            ],
          },
        ];
        streamAssistant(
          aiId,
          "Here's the summary at a glance:\n\nSee [§3 Payment Terms] and [§2 Scope of Services] for the source.",
          { blocks }
        );
        return;
      }

      // Edit-intent → tracked changes
      const isEdit = isEditRequest(text, intent);
      if (isEdit) {
        const count = generateSuggestions();
        streamAssistant(
          aiId,
          `I've added ${count} suggestion${count === 1 ? "" : "s"} to the document. Review them inline and accept or reject each one. See [§2 Scope of Services] and [§5 Termination].`,
          { hasSuggestions: true }
        );
        return;
      }

      // Generic Q&A
      const key = pickResponseKey(text);
      streamAssistant(
        aiId,
        `${MOCK_AI_RESPONSES[key]} See [§3 Payment Terms] for the source.`
      );
    }, 200);
  };

  const handleAcceptAll = () => {
    setAiSuggestions((prev) =>
      prev.map((s) => (s.status === "pending" ? { ...s, status: "accepted" as const } : s))
    );
    toast.success("All suggestions accepted");
  };
  const handleRejectAll = () => {
    setAiSuggestions((prev) =>
      prev.map((s) => (s.status === "pending" ? { ...s, status: "rejected" as const } : s))
    );
    toast.success("All suggestions rejected");
  };

  const togglePlaybook = (id: string) => {
    setActivePlaybooks((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Group history by date label
  const historyGroups = MOCK_HISTORY.reduce<Record<string, HistoryItem[]>>((acc, h) => {
    const k = formatHistoryGroup(h.date);
    (acc[k] ||= []).push(h);
    return acc;
  }, {});

  // Build the seeded review cards from a setup
  const buildReviewCards = (): SuggestionBlockData[] => [
    {
      cardId: `card-${Date.now()}-1`,
      severity: "Critical",
      title: "Late payment interest is above playbook ceiling",
      citation: "§3 Payment Terms",
      oldText: "1.5% per month",
      newText: "1% per month",
      reasoning:
        "Your Vendor MSA Playbook caps late-payment interest at 1% per month (rule #7).",
    },
    {
      cardId: `card-${Date.now()}-2`,
      severity: "Medium",
      title: "Payment window shorter than standard",
      citation: "§3 Payment Terms",
      oldText: "fifteen (15) days",
      newText: "thirty (30) days",
      reasoning:
        "Market norm for B2B services is NET-30. NET-15 puts pressure on Client cash flow.",
    },
    {
      cardId: `card-${Date.now()}-3`,
      severity: "Low",
      title: "Missing governing law",
      description: "No governing-law clause was found in this agreement.",
      citation: "§ End of document",
      newText:
        "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.",
      reasoning:
        "Adding an explicit governing-law clause prevents jurisdictional disputes if a conflict arises.",
    },
  ];

  const appendAssistantMessage = (blocks: RichBlock[], content = "") => {
    const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMessages((prev) => [...prev, { id, role: "assistant", content, blocks }]);
    return id;
  };

  // Run the streaming review: thinking line, then cards one by one with pins
  const runReview = (setupId: string) => {
    const setup = setups[setupId];
    if (!setup) return;
    setReviewRuns((prev) => ({ ...prev, [setupId]: "running" }));

    // 1) Thinking status with countdown
    const statusId = `a-thinking-${Date.now()}`;
    const totalSections = 8;
    setMessages((prev) => [
      ...prev,
      {
        id: statusId,
        role: "assistant",
        content: `Reviewing as ${setup.perspective} · ${setup.scope} · ${setup.playbook}.`,
        blocks: [{ kind: "status", label: `Thinking… reading 1 of ${totalSections} sections` }],
      },
    ]);
    setIsStreaming(true);
    let read = 1;
    const tick = setInterval(() => {
      read += 1;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === statusId
            ? {
                ...m,
                blocks: [
                  {
                    kind: "status",
                    label: `Thinking… reading ${read} of ${totalSections} sections`,
                  },
                ],
              }
            : m
        )
      );
      if (read >= totalSections) clearInterval(tick);
    }, 220);

    // 2) Stream cards one at a time
    const cards = buildReviewCards();
    cards.forEach((card, idx) => {
      setTimeout(() => {
        // Replace the thinking message with a quiet header on first card
        if (idx === 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === statusId
                ? {
                    ...m,
                    content: `Found ${cards.length} issues — streaming as I go.`,
                    blocks: [],
                  }
                : m
            )
          );
        }
        appendAssistantMessage([{ kind: "suggestion", ...card }]);
        addMarginPin(card.citation || "", card.severity, card.cardId);

        if (idx === cards.length - 1) {
          setTimeout(() => {
            appendAssistantMessage(
              [{ kind: "completion", criticalCount: cards.filter((c) => c.severity === "Critical").length }],
              `Review complete — ${cards.length} issues.`
            );
            setIsStreaming(false);
            setReviewRuns((prev) => ({ ...prev, [setupId]: "done" }));
          }, 400);
        }
      }, 2000 + idx * 1200);
    });
  };

  const runSecondPass = () => {
    setIsStreaming(true);
    const headerId = appendAssistantMessage(
      [{ kind: "status", label: "Re-reading after your edits…" }],
      ""
    );
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === headerId
            ? {
                ...m,
                content:
                  "After your edits, I noticed the document still references \"fifteen (15) days\" in a second place — [§7.2]. Want me to align it?",
                blocks: [],
              }
            : m
        )
      );
      const card: SuggestionBlockData = {
        cardId: `card-2pass-${Date.now()}`,
        severity: "Medium",
        title: "Inconsistent payment window in §7.2",
        citation: "§7.2",
        oldText: "fifteen (15) days",
        newText: "thirty (30) days",
        reasoning: "Aligns with the change you applied in §3 Payment Terms.",
      };
      appendAssistantMessage([{ kind: "suggestion", ...card }]);
      addMarginPin(card.citation || "", card.severity, card.cardId);
      setIsStreaming(false);
    }, 1800);
  };

  const resolveCard = (
    msgId: string,
    cardId: string,
    action: "applied" | "dismissed",
    card: SuggestionBlockData
  ) => {
    let label = "";
    if (action === "applied") {
      const ok = applyEditToCanvas(card.citation || "", card.oldText, card.newText);
      label = ok
        ? `Applied — ${card.title.toLowerCase().startsWith("missing")
            ? "added " + card.title.replace(/^Missing\s+/i, "").toLowerCase()
            : card.oldText
            ? `${shortDescribe(card)} changed to “${card.newText.length > 60 ? card.newText.slice(0, 57) + "…" : card.newText}”`
            : "inserted clause"} ${card.citation ? `in ${card.citation}` : ""}`.trim()
        : `Applied — ${card.title}`;
    } else {
      label = `Dismissed — ${card.title}`;
    }
    removeMarginPin(card.cardId);
    // Replace the card block with a status block, keep msg
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const blocks = (m.blocks || []).map((b) =>
          b.kind === "suggestion" && b.cardId === cardId
            ? ({ kind: "status", label } as RichBlock)
            : b
        );
        return { ...m, blocks };
      })
    );
    setHasResolvedAny(true);

    // After Apply, surface a save-rule prompt as an in-panel toast
    if (action === "applied") {
      const suggestedName = deriveRuleName(card);
      setSavePrompts((prev) => [
        ...prev,
        { id: `srp-${cardId}`, suggestedName, stage: "ask" },
      ]);
    }
  };

  const deriveRuleName = (card: SuggestionBlockData) => {
    const t = card.title.toLowerCase();
    if (t.includes("late payment") || t.includes("late-payment")) return "Late-payment interest ≤ 1%/month";
    if (t.includes("payment window")) return "Payment window ≥ 30 days";
    if (t.includes("governing law")) return "Require governing-law clause";
    return card.title;
  };

  const dismissSavePrompt = (id: string) =>
    setSavePrompts((prev) => prev.filter((p) => p.id !== id));

  const openSaveRuleForm = (id: string) =>
    setSavePrompts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stage: "form",
              ruleName: p.ruleName ?? p.suggestedName,
              savedTo: p.savedTo ?? (activePlaybooks.includes("my-playbook") ? "my-playbook" : activePlaybooks[0]),
            }
          : p
      )
    );

  const confirmSaveRule = (id: string) =>
    setSavePrompts((prev) => prev.map((p) => (p.id === id ? { ...p, stage: "saved" } : p)));

  const updateSavePrompt = (id: string, patch: Partial<SaveRulePrompt>) =>
    setSavePrompts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Violations seed
  type Violation = {
    id: string;
    title: string;
    citation: string;
    severity: "Critical" | "Medium" | "Low";
    description: string;
    card: SuggestionBlockData;
  };
  const VIOLATIONS_SEED: Violation[] = [
    {
      id: "v1",
      title: "Payment window shorter than playbook standard",
      citation: "§3 Payment Terms",
      severity: "Medium",
      description: "Document uses NET-15; Vendor MSA Playbook expects NET-30.",
      card: {
        cardId: `violation-card-v1`,
        severity: "Medium",
        title: "Payment window shorter than standard",
        citation: "§3 Payment Terms",
        oldText: "fifteen (15) days",
        newText: "thirty (30) days",
        reasoning: "Vendor MSA Playbook expects NET-30 for B2B services.",
      },
    },
    {
      id: "v2",
      title: "Missing governing law",
      citation: "§ End of document",
      severity: "Low",
      description: "No governing-law clause was found in this agreement.",
      card: {
        cardId: `violation-card-v2`,
        severity: "Low",
        title: "Missing governing law",
        description: "No governing-law clause was found in this agreement.",
        citation: "§ End of document",
        newText:
          "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.",
        reasoning: "Adding an explicit governing-law clause prevents jurisdictional disputes.",
      },
    },
  ];
  const visibleViolations = VIOLATIONS_SEED.filter((v) => !resolvedViolations.includes(v.id));

  const openViolationInChat = (v: Violation) => {
    setActiveTab("chat");
    import("./ai-blocks/aiBlockUtils").then(({ jumpToSection }) => jumpToSection(v.citation));
    const card: SuggestionBlockData = { ...v.card, cardId: `${v.card.cardId}-${Date.now()}` };
    appendAssistantMessage(
      [{ kind: "suggestion", ...card }],
      `From Violations — let's address: ${v.title}.`
    );
    addMarginPin(card.citation || "", card.severity, card.cardId);
    setResolvedViolations((prev) => [...prev, v.id]);
  };

  const shortDescribe = (card: SuggestionBlockData) => {
    const t = card.title.toLowerCase();
    if (t.includes("late payment")) return "Late payment interest";
    if (t.includes("payment window")) return "Payment window";
    return card.title;
  };

  const updateSetup = (setupId: string, next: ReviewSetup) =>
    setSetups((prev) => ({ ...prev, [setupId]: next }));

  // Render AI text and convert [§...] tokens into CitationPills
  const renderAiText = (text: string) => {
    const parts = text.split(/(\[§[^\]]+\])/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[(§[^\]]+)\]$/);
      if (m) return <CitationPill key={i} label={m[1]} />;
      return <span key={i}>{part}</span>;
    });
  };

  const renderBlock = (block: RichBlock, idx: number, msgId: string) => {
    switch (block.kind) {
      case "suggestion":
        return (
          <div key={block.cardId} className="animate-fade-in">
            <SuggestionCard
              {...block}
              onApply={() => resolveCard(msgId, block.cardId, "applied", block)}
              onDismiss={() => resolveCard(msgId, block.cardId, "dismissed", block)}
            />
          </div>
        );
      case "table":
        return <ComparisonTable key={idx} {...block} />;
      case "checklist":
        return <Checklist key={idx} {...block} />;
      case "setup":
        return (
          <ReviewSetupCard
            key={block.setupId}
            setup={setups[block.setupId]}
            onChange={(next) => updateSetup(block.setupId, next)}
            onStart={() => runReview(block.setupId)}
            onEdit={() => toast("Tweak any value above")}
            started={reviewRuns[block.setupId] !== "idle"}
          />
        );
      case "status":
        return (
          <div
            key={idx}
            className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground animate-fade-in"
          >
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="leading-snug">{block.label}</span>
          </div>
        );
      case "completion":
        return (
          <div key={idx} className="mt-2 flex flex-wrap gap-1.5 animate-fade-in">
            <Button
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                // Apply all critical via DOM helper for the seeded card
                applyEditToCanvas("§3 Payment Terms", "1.5% per month", "1% per month");
                setMessages((prev) =>
                  prev.map((m) => {
                    const blocks = (m.blocks || []).map((b) => {
                      if (b.kind === "suggestion" && b.severity === "Critical") {
                        removeMarginPin(b.cardId);
                        return {
                          kind: "status",
                          label: `Applied — late-payment interest changed to 1% per month in §3.`,
                        } as RichBlock;
                      }
                      return b;
                    });
                    return { ...m, blocks };
                  })
                );
                setHasResolvedAny(true);
              }}
            >
              Apply all critical
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={runSecondPass}
              disabled={!hasResolvedAny || isStreaming}
              title={!hasResolvedAny ? "Apply or dismiss a suggestion first" : "Re-read the document"}
            >
              Run second pass
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AiIcon size={16} />
            <span className="text-sm font-semibold">Signit AI</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant={activeTab === "violations" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[11px] gap-1"
              onClick={() => setActiveTab((t) => (t === "violations" ? "chat" : "violations"))}
              title="Violations"
            >
              <ShieldAlert size={13} />
              Violations
              {visibleViolations.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive/15 text-destructive text-[10px] font-semibold">
                  {visibleViolations.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setHistoryOpen(true)}
              title="History"
            >
              <History size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setCanvasInitialLayout("outline");
                setCanvasOpen(true);
              }}
              title="Expand to canvas"
            >
              <Maximize2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              title="Close"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Playbook chip */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            <Sparkles size={10} />
            Using: {primaryPlaybookName}
            {activePlaybooks.length > 1 && ` +${activePlaybooks.length - 1}`}
          </span>
          <span>·</span>
          <Popover open={playbookOpen} onOpenChange={setPlaybookOpen}>
            <PopoverTrigger asChild>
              <button className="text-primary hover:underline font-medium">change</button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="px-3 pt-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Active playbooks
              </div>
              <div className="px-1.5 pb-1.5 space-y-0.5">
                {PLAYBOOKS.map((pb) => {
                  const on = activePlaybooks.includes(pb.id);
                  return (
                    <div
                      key={pb.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-accent"
                    >
                      <span className="text-xs text-foreground">{pb.name}</span>
                      <Switch checked={on} onCheckedChange={() => togglePlaybook(pb.id)} />
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setPlaybookOpen(false);
                  toast("Opening playbook manager…");
                }}
                className="flex items-center gap-1 px-3 py-2 w-full text-left text-xs font-medium text-primary hover:bg-accent border-t border-border"
              >
                Manage playbooks
                <ExternalLink size={11} />
              </button>
              <div className="px-3 py-2 text-[10px] leading-snug text-muted-foreground bg-muted/40 border-t border-border">
                Signit AI auto-selects playbooks based on the document type.
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Conversation / Violations */}
      {activeTab === "violations" ? (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="flex items-start gap-2 pb-1">
            <ShieldAlert size={14} className="text-destructive mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Playbook violations</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                Rules currently broken in this document. Click one to address it in chat.
              </div>
            </div>
          </div>
          {visibleViolations.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center">
              <div className="text-xs font-medium text-foreground">All clear</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                No active violations from your playbooks.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleViolations.map((v) => {
                const sevColor =
                  v.severity === "Critical"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : v.severity === "Medium"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20";
                return (
                  <button
                    key={v.id}
                    onClick={() => openViolationInChat(v)}
                    className="w-full text-left rounded-xl border bg-background/60 hover:bg-accent/40 hover:border-primary/40 transition-colors px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
                          sevColor
                        )}
                      >
                        {v.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{v.citation}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground leading-snug">
                      {v.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {v.description}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <>
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs leading-relaxed text-foreground">
                  Hi Ahmed — I've read your <span className="font-medium">Master Services Agreement</span>. I can see <span className="font-medium">2 parties</span>, <span className="font-medium">3 open comments</span>, and one redlined clause (<span className="font-medium">Payment Terms</span>). Ask me anything, or pick an intent below to get started.
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pl-8">
              {[
                "Summarize this contract",
                "Review as Client",
                "Check payment terms against Vendor MSA Playbook",
                "Explain the redline on Payment Terms",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors text-foreground/90"
                >
                  {chip}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex flex-col items-end">
              {msg.selectedText && (
                <div className="max-w-[90%] mb-1 px-2.5 py-1.5 rounded-md bg-muted/60 border border-border text-[11px] text-muted-foreground italic line-clamp-2">
                  "{msg.selectedText}"
                </div>
              )}
              <div className="max-w-[90%] px-3 py-2 rounded-2xl rounded-br-sm bg-muted text-foreground text-xs leading-relaxed">
                {msg.intent && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide bg-primary/15 text-primary mr-1.5 align-middle">
                    {msg.intent}
                  </span>
                )}
                {msg.content}
              </div>
              {msg.scope && msg.scope !== "Full document" && (
                <span className="text-[10px] text-muted-foreground mt-0.5 mr-1">
                  Scope: {msg.scope}
                </span>
              )}
            </div>
          ) : (
            <div key={msg.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {renderAiText(msg.content)}
                  {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                    <span className="inline-block w-1 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
                {msg.blocks?.map((b, i) => renderBlock(b, i, msg.id))}
                {msg.hasSuggestions && !isStreaming && pendingSuggestions.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" className="h-7 text-[10px] flex-1" onClick={handleAcceptAll}>
                      <Check size={12} className="mr-1" />
                      Accept all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] flex-1"
                      onClick={handleRejectAll}
                    >
                      Reject all
                    </Button>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-muted-foreground/70">
                  Sources: 2 · Just now
                </div>
              </div>
            </div>
          )
        )}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={12} className="text-primary animate-pulse" />
            </div>
            <div className="flex items-center gap-1 pt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
      )}

      {/* In-panel save-rule toasts */}
      {savePrompts.length > 0 && (
        <div className="px-3 pt-2 pb-1 space-y-1.5 flex-shrink-0">
          {savePrompts.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-primary/30 bg-primary/5 backdrop-blur-sm px-3 py-2 animate-fade-in"
            >
              {p.stage === "ask" && (
                <div className="flex items-start gap-2">
                  <Bookmark size={13} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-foreground leading-snug">
                      Saved the fix to the doc. Want to save{" "}
                      <span className="font-medium">"{p.suggestedName}"</span> as a rule so we catch it next time?
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        onClick={() => openSaveRuleForm(p.id)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Save rule
                      </button>
                      <button
                        onClick={() => dismissSavePrompt(p.id)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:bg-muted"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissSavePrompt(p.id)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {p.stage === "form" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Bookmark size={11} className="text-primary" />
                    Save as playbook rule
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Rule name
                    </label>
                    <Input
                      value={p.ruleName ?? ""}
                      onChange={(e) => updateSavePrompt(p.id, { ruleName: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Save to
                    </label>
                    <Select
                      value={p.savedTo}
                      onValueChange={(v) => updateSavePrompt(p.id, { savedTo: v })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYBOOKS.filter((pb) => activePlaybooks.includes(pb.id)).map((pb) => (
                          <SelectItem key={pb.id} value={pb.id} className="text-xs">
                            {pb.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <button
                      onClick={() => dismissSavePrompt(p.id)}
                      className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmSaveRule(p.id)}
                      disabled={!p.ruleName?.trim()}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {p.stage === "saved" && (
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 text-[11px] text-foreground leading-snug">
                    Rule saved to{" "}
                    <span className="font-medium">
                      {PLAYBOOKS.find((pb) => pb.id === p.savedTo)?.name ?? "playbook"}
                    </span>
                  </div>
                  <button
                    onClick={() => dismissSavePrompt(p.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-primary hover:bg-primary/10"
                  >
                    <Undo2 size={11} />
                    Undo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="border-t bg-card px-3 pt-2.5 pb-2 flex-shrink-0 space-y-2">
        {/* Intent chips */}
        <div className="flex gap-1.5 flex-wrap">
          {INTENT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveIntent((cur) => (cur === chip ? null : chip))}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                activeIntent === chip
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Scope row */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                {scope}
                <ChevronDown size={11} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SCOPES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setScope(s)}>
                  {scope === s && <Check size={12} className="mr-1.5" />}
                  <span className={scope === s ? "" : "ml-[18px]"}>{s}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Selected text preview */}
        {quotedText && (
          <div className="rounded-md border bg-muted/40 px-2.5 py-1.5 relative">
            <button
              onClick={() => setQuotedText(null)}
              className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X size={11} />
            </button>
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Selected text</p>
            <p className="text-xs text-foreground line-clamp-3 italic pr-5">"{quotedText}"</p>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-1.5 items-end">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={
              activeIntent
                ? `${activeIntent}…`
                : quotedText
                ? "What should AI do with this text?"
                : "Message Signit AI…"
            }
            className="min-h-[36px] max-h-[120px] resize-none text-xs py-2"
            disabled={isStreaming}
          />
          <Button
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            disabled={!input.trim() || isStreaming}
            onClick={handleSend}
          >
            <Send size={14} />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/80 text-center pt-0.5">
          Signit AI may make mistakes — see sources on every reply
        </p>
      </div>

      {/* History side drawer */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[320px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <History size={14} />
              Conversation history
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {Object.entries(historyGroups).map(([group, items]) => (
              <div key={group}>
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground px-2 mb-1.5">
                  {group}
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        toast(`Loaded: ${item.title}`);
                        setHistoryOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.preview}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EditorAIPanel;
