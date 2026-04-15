import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MOCK_COMMENTS = [
  {
    id: "c1",
    author: "Ahmad Medhat",
    text: "We need to revisit the indemnification clause in section 4.2. The liability cap seems too low for this type of engagement.",
    timestamp: "2d ago",
    type: "comment" as const,
    replies: [
      { id: "r1", author: "Sarah Johnson", text: "Agreed. I suggest we increase it to 2x the annual fees.", timestamp: "1d ago" },
    ],
  },
  {
    id: "c2",
    author: "Sarah Johnson",
    text: "Consider adding a data processing addendum as a supplement document, given the nature of the services.",
    timestamp: "3d ago",
    type: "suggestion" as const,
    replies: [],
  },
  {
    id: "c3",
    author: "AI Assistant",
    text: "This non-compete clause (Section 7.3) may be overly broad in scope. Consider narrowing the geographic restriction to specific regions where services are actually performed.",
    timestamp: "3d ago",
    type: "ai" as const,
    replies: [],
  },
  {
    id: "c4",
    author: "Mike Torres",
    text: "Payment terms should be NET 15, not NET 30, per our updated vendor policy.",
    timestamp: "5d ago",
    type: "comment" as const,
    replies: [
      { id: "r2", author: "Ahmad Medhat", text: "Updated. Good catch.", timestamp: "4d ago" },
    ],
  },
];

const FILTER_OPTIONS = ["All", "Comments", "Suggestions", "AI"] as const;

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

export default function DocumentViewCommentsPanel() {
  const [filter, setFilter] = useState<typeof FILTER_OPTIONS[number]>("All");

  const filtered = MOCK_COMMENTS.filter((c) => {
    if (filter === "All") return true;
    if (filter === "Comments") return c.type === "comment";
    if (filter === "Suggestions") return c.type === "suggestion";
    if (filter === "AI") return c.type === "ai";
    return true;
  });

  const typeColors = {
    comment: "border-l-muted-foreground",
    suggestion: "border-l-amber-400",
    ai: "border-l-violet-400",
  };

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex items-center gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              filter === opt ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground hover:text-foreground border-border"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Read-only — comments from editing phase</p>

      {/* Comments list */}
      {filtered.map((c) => (
        <div key={c.id} className={cn("border-l-2 pl-3 space-y-2", typeColors[c.type])}>
          <div className="flex items-start gap-2">
            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
              <AvatarFallback className={cn("text-[9px]", c.type === "ai" ? "bg-violet-100 text-violet-600" : "bg-muted")}>{initials(c.author)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">{c.author}</span>
                {c.type === "ai" && <Badge variant="secondary" className="text-[9px] h-3.5 px-1 bg-violet-100 text-violet-600">AI</Badge>}
                <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
              </div>
              <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">{c.text}</p>
            </div>
          </div>

          {/* Replies */}
          {c.replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2 ml-8">
              <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                <AvatarFallback className="text-[8px] bg-muted">{initials(r.author)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{r.author}</span>
                  <span className="text-[10px] text-muted-foreground">{r.timestamp}</span>
                </div>
                <p className="text-xs text-foreground/80 mt-0.5">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
