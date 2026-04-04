import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "inline" | "general";

interface Reply {
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
}

interface InlineComment {
  id: string;
  section: string;
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  status: "open" | "resolved";
  replies: Reply[];
}

interface GeneralMessage {
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
}

const MOCK_INLINE: InlineComment[] = [
  {
    id: "c1",
    section: "Section 2: Scope of Services",
    author: "Ahmed Al-Rashid",
    initials: "AA",
    color: "#4F46E5",
    time: "2 hours ago",
    text: "We need to revise the scope to include the additional deliverables discussed in yesterday's call",
    status: "open",
    replies: [
      {
        author: "Sarah Johnson",
        initials: "SJ",
        color: "#DC2626",
        time: "1 hour ago",
        text: "Agreed. I'll update the deliverables list.",
      },
    ],
  },
  {
    id: "c2",
    section: "Section 3: Payment Terms",
    author: "Mohammed Al-Faisal",
    initials: "MA",
    color: "#059669",
    time: "Yesterday",
    text: "Payment terms should be NET-30, not NET-60",
    status: "resolved",
    replies: [],
  },
  {
    id: "c3",
    section: "Section 5: Termination",
    author: "Ahmed Al-Rashid",
    initials: "AA",
    color: "#4F46E5",
    time: "3 hours ago",
    text: "Legal team to review this clause",
    status: "open",
    replies: [],
  },
];

const MOCK_GENERAL: GeneralMessage[] = [
  {
    author: "Ahmed Al-Rashid",
    initials: "AA",
    color: "#4F46E5",
    time: "Today, 10:30 AM",
    text: "Let's finalize this before EOD Thursday",
  },
  {
    author: "Sarah Johnson",
    initials: "SJ",
    color: "#DC2626",
    time: "Today, 11:15 AM",
    text: "On it! Just waiting for legal's feedback on Section 5",
  },
];

const Avatar = ({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
    style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.35 }}
  >
    {initials}
  </div>
);

const EditorCommentsPanel = () => {
  const [tab, setTab] = useState<Tab>("inline");
  const [comments, setComments] = useState(MOCK_INLINE);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set(["c1"]));
  const [inputValue, setInputValue] = useState("");

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleResolve = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolved" as const } : c))
    );
  };

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Tabs */}
      <div className="flex border-b px-4 flex-shrink-0">
        {(["inline", "general"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "inline" ? "Inline" : "General"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "inline" ? (
          comments.map((c) => {
            const isResolved = c.status === "resolved";
            const hasReplies = c.replies.length > 0;
            const showReplies = expandedReplies.has(c.id);

            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-lg p-3 border-l-[3px]",
                  isResolved
                    ? "bg-muted/30 opacity-60 border-l-emerald-500"
                    : "bg-muted/50 border-l-amber-500"
                )}
              >
                {/* Section anchor */}
                <p className={cn("text-[11px] font-medium mb-2 text-muted-foreground", isResolved && "line-through")}>
                  {c.section}
                </p>

                {/* Author row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar initials={c.initials} color={c.color} size={28} />
                  <span className="text-sm font-medium text-foreground">{c.author}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{c.time}</span>
                </div>

                {/* Text */}
                <p className="text-sm text-foreground/90 mb-2">{c.text}</p>

                {/* Status + actions */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] h-5",
                      isResolved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {isResolved ? "Resolved" : "Open"}
                  </Badge>

                  {!isResolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 gap-1 text-muted-foreground"
                      onClick={() => handleResolve(c.id)}
                    >
                      <CheckCircle2 size={12} />
                      Resolve
                    </Button>
                  )}

                  {hasReplies && (
                    <button
                      onClick={() => toggleReplies(c.id)}
                      className="text-[11px] text-primary hover:underline ml-auto"
                    >
                      {showReplies ? "Hide" : `${c.replies.length} ${c.replies.length === 1 ? "reply" : "replies"}`}
                    </button>
                  )}
                </div>

                {/* Replies */}
                {hasReplies && showReplies && (
                  <div className="mt-2.5 pl-8 space-y-2 border-l border-border ml-3.5">
                    {c.replies.map((r, i) => (
                      <div key={i} className="pl-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Avatar initials={r.initials} color={r.color} size={22} />
                          <span className="text-xs font-medium">{r.author}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{r.time}</span>
                        </div>
                        <p className="text-xs text-foreground/80">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* General tab */
          MOCK_GENERAL.map((m, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar initials={m.initials} color={m.color} size={28} />
                <span className="text-sm font-medium text-foreground">{m.author}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{m.time}</span>
              </div>
              <p className="text-sm text-foreground/90">{m.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex-shrink-0 space-y-1.5">
        {tab === "inline" && (
          <p className="text-[11px] text-muted-foreground">
            Select text in the document to add an inline comment
          </p>
        )}
        <div className="flex gap-2">
          <Input
            placeholder={tab === "inline" ? "Add a comment..." : "Write a message..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="icon" className="h-9 w-9 flex-shrink-0" disabled={!inputValue.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorCommentsPanel;
