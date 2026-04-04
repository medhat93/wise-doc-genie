import { useState, useRef, useEffect, useCallback } from "react";
import { Send, CheckCircle2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEditorContext, type Comment } from "./EditorContext";

/* ── Helpers ── */
const timeAgo = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const DEFAULT_AUTHOR = { name: "Ahmed Al-Rashid", initials: "AA", color: "#4F46E5" };

const Avatar = ({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
    style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.35 }}
  >
    {initials}
  </div>
);

/* ── Inline comment card ── */
const InlineCommentCard = ({
  comment,
  onResolve,
  onReply,
}: {
  comment: Comment;
  onResolve: (id: string) => void;
  onReply: (id: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(comment.replies.length > 0);
  const isResolved = comment.status === "resolved";

  return (
    <div
      className={cn(
        "rounded-lg p-3 border-l-[3px]",
        isResolved
          ? "bg-muted/30 opacity-60 border-l-emerald-500"
          : "bg-muted/50 border-l-amber-500"
      )}
    >
      <p className={cn("text-[11px] font-medium mb-2 text-muted-foreground", isResolved && "line-through")}>
        {comment.sectionRef}
      </p>

      <div className="flex items-center gap-2 mb-1.5">
        <Avatar initials={comment.authorInitials} color={comment.authorColor} size={28} />
        <span className="text-sm font-medium text-foreground">{comment.author}</span>
        <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(comment.timestamp)}</span>
      </div>

      <p className="text-sm text-foreground/90 mb-2">{comment.text}</p>

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
          <>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-muted-foreground" onClick={() => onResolve(comment.id)}>
              <CheckCircle2 size={12} /> Resolve
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-muted-foreground" onClick={() => onReply(comment.id)}>
              Reply
            </Button>
          </>
        )}

        {comment.replies.length > 0 && (
          <button onClick={() => setShowReplies(!showReplies)} className="text-[11px] text-primary hover:underline ml-auto">
            {showReplies ? "Hide" : `${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
          </button>
        )}
      </div>

      {showReplies && comment.replies.length > 0 && (
        <div className="mt-2.5 pl-8 space-y-2 border-l border-border ml-3.5">
          {comment.replies.map((r) => (
            <div key={r.id} className="pl-3">
              <div className="flex items-center gap-2 mb-0.5">
                <Avatar initials={r.authorInitials} color={r.authorColor} size={22} />
                <span className="text-xs font-medium">{r.author}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(r.timestamp)}</span>
              </div>
              <p className="text-xs text-foreground/80">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════ MAIN ══════════ */
const EditorCommentsPanel = () => {
  const { comments, setComments, pendingCommentRef, setPendingCommentRef } = useEditorContext();
  const [tab, setTab] = useState<"inline" | "general">("inline");
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const generalEndRef = useRef<HTMLDivElement>(null);

  // When pendingCommentRef arrives, switch to inline tab and focus input
  useEffect(() => {
    if (pendingCommentRef) {
      setTab("inline");
      setReplyingTo(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [pendingCommentRef]);

  const inlineComments = comments.filter((c) => c.type === "inline");
  const generalMessages = comments.filter((c) => c.type === "general");

  const openComments = inlineComments.filter((c) => c.status === "open").sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const resolvedComments = inlineComments.filter((c) => c.status === "resolved").sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Auto-scroll general tab
  useEffect(() => {
    if (tab === "general") generalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generalMessages.length, tab]);

  const handleResolve = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: "resolved" as const } : c));
  }, [setComments]);

  const handleReply = useCallback((id: string) => {
    setReplyingTo(id);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    if (tab === "inline") {
      if (replyingTo) {
        const reply = {
          id: `r${Date.now()}`,
          author: DEFAULT_AUTHOR.name,
          authorInitials: DEFAULT_AUTHOR.initials,
          authorColor: DEFAULT_AUTHOR.color,
          text,
          timestamp: new Date(),
        };
        setComments((prev) => prev.map((c) => c.id === replyingTo ? { ...c, replies: [...c.replies, reply] } : c));
        setReplyingTo(null);
      } else {
        const newComment: Comment = {
          id: `c${Date.now()}`,
          author: DEFAULT_AUTHOR.name,
          authorInitials: DEFAULT_AUTHOR.initials,
          authorColor: DEFAULT_AUTHOR.color,
          text,
          timestamp: new Date(),
          sectionRef: pendingCommentRef || "General note",
          status: "open",
          replies: [],
          type: "inline",
        };
        setComments((prev) => [newComment, ...prev]);
        setPendingCommentRef(null);
      }
    } else {
      const msg: Comment = {
        id: `g${Date.now()}`,
        author: DEFAULT_AUTHOR.name,
        authorInitials: DEFAULT_AUTHOR.initials,
        authorColor: DEFAULT_AUTHOR.color,
        text,
        timestamp: new Date(),
        sectionRef: "",
        status: "open",
        replies: [],
        type: "general",
      };
      setComments((prev) => [...prev, msg]);
    }

    setInputValue("");
  }, [inputValue, tab, replyingTo, pendingCommentRef, setComments, setPendingCommentRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const replyingComment = replyingTo ? comments.find((c) => c.id === replyingTo) : null;

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Tabs */}
      <div className="flex border-b px-4 flex-shrink-0">
        {(["inline", "general"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setReplyingTo(null); setPendingCommentRef(null); }}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "inline" ? "Inline" : "General"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "inline" ? (
          <>
            {/* Show/hide resolved toggle */}
            {resolvedComments.length > 0 && (
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                {showResolved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showResolved ? "Hide resolved" : `Show ${resolvedComments.length} resolved`}
              </button>
            )}

            {openComments.map((c) => (
              <InlineCommentCard key={c.id} comment={c} onResolve={handleResolve} onReply={handleReply} />
            ))}

            {showResolved && resolvedComments.map((c) => (
              <InlineCommentCard key={c.id} comment={c} onResolve={handleResolve} onReply={handleReply} />
            ))}

            {openComments.length === 0 && resolvedComments.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No comments yet</div>
            )}
          </>
        ) : (
          <>
            {generalMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map((m) => (
              <div key={m.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar initials={m.authorInitials} color={m.authorColor} size={28} />
                  <span className="text-sm font-medium text-foreground">{m.author}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(m.timestamp)}</span>
                </div>
                <p className="text-sm text-foreground/90">{m.text}</p>
              </div>
            ))}
            <div ref={generalEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex-shrink-0 space-y-1.5">
        {/* Pending comment ref preview */}
        {tab === "inline" && pendingCommentRef && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 rounded-r-md px-2.5 py-1.5">
            <p className="text-xs text-muted-foreground italic flex-1 line-clamp-2">"{pendingCommentRef}"</p>
            <button onClick={() => setPendingCommentRef(null)} className="text-muted-foreground hover:text-foreground mt-0.5">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Replying indicator */}
        {replyingComment && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
            <span>Replying to <strong>{replyingComment.author}</strong></span>
            <button onClick={() => setReplyingTo(null)} className="ml-auto hover:text-foreground"><X size={12} /></button>
          </div>
        )}

        {tab === "inline" && !pendingCommentRef && !replyingComment && (
          <p className="text-[11px] text-muted-foreground">Select text in the document to add an inline comment</p>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            placeholder={tab === "inline" ? "Add a comment..." : "Write a message..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[36px] max-h-[100px] text-sm resize-none"
            rows={1}
          />
          <Button size="icon" className="h-9 w-9 flex-shrink-0" disabled={!inputValue.trim()} onClick={handleSubmit}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorCommentsPanel;
