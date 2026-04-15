import React from "react";
import { WorkspaceDocument } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, Clock, Circle } from "lucide-react";

const participantColors: Record<string, string> = {
  "Ahmad Medhat": "bg-blue-500",
  "Sarah Johnson": "bg-rose-500",
  "Mike Torres": "bg-amber-500",
  "Pepper Potts": "bg-purple-500",
  "Bruce Wayne": "bg-slate-700",
  "Lisa Chen": "bg-teal-500",
  "David Park": "bg-indigo-500",
  "John Smith": "bg-emerald-500",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(ts: string) {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
}

export default function DocumentViewParticipantsPanel({ doc }: { doc: WorkspaceDocument }) {
  const allParticipants = doc.participants;
  const signers = allParticipants.filter((p) => p.role === "signer");
  const approvers = allParticipants.filter((p) => p.role === "approver");
  const viewers = allParticipants.filter((p) => p.role === "viewer");
  const isApproval = ["approving", "approved"].includes(doc.stage);
  const isSigning = ["sent", "partially_signed", "waiting", "requires_action", "expiring"].includes(doc.stage);
  const isSequential = isSigning || isApproval;
  const timelineParticipants = isApproval ? [...approvers, ...signers] : [...signers];
  const actionLabel = isApproval ? "approved" : "signed";
  const completedCount = timelineParticipants.filter((p) => p.status === "signed").length;
  const totalAction = timelineParticipants.length;
  const progressPercent = totalAction > 0 ? (completedCount / totalAction) * 100 : 0;

  const getNodeStatus = (p: typeof allParticipants[0]) => {
    if (p.status === "signed") return "completed";
    if (p.status === "declined") return "declined";
    if (doc.waitingFor?.name === p.name) return "current";
    if (p.status === "viewed") return "current";
    return "pending";
  };

  if (isSequential && timelineParticipants.length > 0) {
    return (
      <div className="space-y-4">
        <div className="relative">
          {timelineParticipants.map((p, i) => {
            const status = getNodeStatus(p);
            const isLast = i === timelineParticipants.length - 1;
            const color = participantColors[p.name] || "bg-muted-foreground";
            return (
              <div key={p.id} className="flex gap-3 relative group">
                {!isLast && (
                  <div className={cn("absolute left-[11px] top-8 bottom-0 w-0.5", status === "completed" ? "bg-green-500" : status === "current" ? "bg-gradient-to-b from-green-500 to-primary" : "border-l-2 border-dashed border-border bg-transparent")} />
                )}
                <div className={cn("relative z-10 mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0", status === "completed" && "bg-green-500", status === "current" && "bg-primary animate-pulse", status === "pending" && "bg-muted border-2 border-border", status === "declined" && "bg-destructive")}>
                  {status === "completed" && <Check size={12} className="text-white" />}
                  {status === "current" && <Clock size={12} className="text-primary-foreground" />}
                  {status === "declined" && <X size={12} className="text-white" />}
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn("text-[10px] text-white font-medium", color)}>{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded capitalize">{p.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                  </div>
                  <div className="mt-1 ml-9">
                    {status === "completed" && p.signedAt && <p className="text-xs text-green-600">Signed · {formatDate(p.signedAt)}</p>}
                    {status === "current" && <p className="text-xs text-primary">Waiting for signature · since {daysSince(doc.waitingFor?.since || doc.modifiedAt)}d</p>}
                    {status === "pending" && <p className="text-xs text-muted-foreground">Not yet sent</p>}
                    {status === "declined" && <p className="text-xs text-destructive">Declined · Reason: Terms not acceptable</p>}
                    {(status === "current" || status === "pending") && isSigning && (
                      <button className="text-[10px] text-primary hover:underline mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Send reminder</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {viewers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Viewers</p>
            {viewers.map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30">
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-muted">{initials(p.name)}</AvatarFallback></Avatar>
                <span className="text-sm truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{p.email}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{completedCount} of {totalAction} {actionLabel}</span>
            <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>
    );
  }

  // Grouped list
  const grouped = {
    signed: allParticipants.filter((p) => p.status === "signed"),
    pending: allParticipants.filter((p) => ["pending", "viewed"].includes(p.status)),
    not_sent: allParticipants.filter((p) => p.status === "not_sent"),
    declined: allParticipants.filter((p) => p.status === "declined"),
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([status, participants]) => {
        if (participants.length === 0) return null;
        const groupLabel = status === "signed" ? "Signed" : status === "pending" ? "Waiting" : status === "not_sent" ? "Pending" : "Declined";
        return (
          <div key={status}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{groupLabel}</p>
            {participants.map((p) => {
              const color = participantColors[p.name] || "bg-muted-foreground";
              return (
                <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30">
                  <Avatar className="h-7 w-7"><AvatarFallback className={cn("text-[10px] text-white font-medium", color)}>{initials(p.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {p.status === "signed" && p.signedAt && <span className="text-xs text-green-600">Signed · {formatDate(p.signedAt)}</span>}
                    {p.status === "not_sent" && <span className="text-xs text-muted-foreground">Not yet sent</span>}
                    {p.status === "declined" && <span className="text-xs text-destructive">Declined</span>}
                    {["pending", "viewed"].includes(p.status) && <span className="text-xs text-primary">Waiting</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{allParticipants.filter((p) => p.status === "signed").length} of {signers.length} signed</span>
        </div>
        <Progress value={signers.length > 0 ? (allParticipants.filter((p) => p.status === "signed").length / signers.length) * 100 : 0} className="h-1.5" />
      </div>
    </div>
  );
}
