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
} from "lucide-react";
import AiIcon from "@/components/AiIcon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import type { AiSuggestion, Comment } from "./EditorContext";
import SuggestionCard, { type SuggestionCardProps } from "./ai-blocks/SuggestionCard";
import ComparisonTable, { type ComparisonTableProps } from "./ai-blocks/ComparisonTable";
import Checklist, { type ChecklistProps } from "./ai-blocks/Checklist";
import CitationPill from "./ai-blocks/CitationPill";

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
  { id: "nda-standard", name: "Standard NDA Playbook" },
  { id: "data-protection", name: "Data Protection Playbook" },
  { id: "employment", name: "Employment Contract Playbook" },
];

interface RichBlock {
  kind: "card" | "table" | "diff" | "checklist";
  title?: string;
}

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
  const [activePlaybooks, setActivePlaybooks] = useState<string[]>(["vendor-msa"]);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      const isEdit = isEditRequest(text, intent);
      const aiId = `a-${Date.now()}`;
      if (isEdit) {
        const count = generateSuggestions();
        streamAssistant(
          aiId,
          `I've added ${count} suggestion${count === 1 ? "" : "s"} to the document. Review them inline and accept or reject each one.`,
          { hasSuggestions: true, blocks: [{ kind: "diff", title: "Suggested redlines" }] }
        );
      } else {
        const key = pickResponseKey(text);
        const blocks: RichBlock[] | undefined =
          intent === "Summarize" || key === "summarize"
            ? [{ kind: "card", title: "Document summary" }]
            : key === "payment"
            ? [{ kind: "table", title: "Pricing breakdown" }]
            : intent === "Review"
            ? [{ kind: "checklist", title: "Review checklist" }]
            : undefined;
        streamAssistant(aiId, MOCK_AI_RESPONSES[key], { blocks });
      }
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

  const renderBlock = (block: RichBlock, idx: number) => {
    switch (block.kind) {
      case "card":
        return (
          <div
            key={idx}
            className="rounded-lg border border-border bg-muted/30 p-3 mt-2"
          >
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              {block.title}
            </div>
            <div className="text-xs text-foreground/80">[card placeholder]</div>
          </div>
        );
      case "table":
        return (
          <div
            key={idx}
            className="rounded-lg border border-border overflow-hidden mt-2"
          >
            <div className="bg-muted/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground border-b">
              {block.title}
            </div>
            <div className="p-3 text-xs text-foreground/80">[table placeholder]</div>
          </div>
        );
      case "diff":
        return (
          <div
            key={idx}
            className="rounded-lg border border-primary/30 bg-primary/5 p-3 mt-2"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-primary mb-1">
              <Sparkles size={10} />
              {block.title}
            </div>
            <div className="text-xs text-foreground/80">[diff placeholder]</div>
          </div>
        );
      case "checklist":
        return (
          <div
            key={idx}
            className="rounded-lg border border-border bg-muted/30 p-3 mt-2"
          >
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              {block.title}
            </div>
            <div className="text-xs text-foreground/80">[checklist placeholder]</div>
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
                setExpanded((v) => !v);
                toast(expanded ? "Collapsed" : "Expanded to canvas");
              }}
              title="Expand"
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
            <PopoverContent className="w-64 p-2" align="start">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
                Playbooks
              </div>
              <div className="space-y-0.5">
                {PLAYBOOKS.map((pb) => (
                  <label
                    key={pb.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={activePlaybooks.includes(pb.id)}
                      onCheckedChange={() => togglePlaybook(pb.id)}
                    />
                    <span className="text-xs">{pb.name}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Conversation */}
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
                  {msg.content}
                  {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                    <span className="inline-block w-1 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
                {msg.blocks?.map((b, i) => renderBlock(b, i))}
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
