import React from "react";
import { WorkspaceDocument } from "@/types/workspace";
import { cn } from "@/lib/utils";
import {
  Plus, Send, Eye, CheckCircle, XCircle, Clock, FileText, Ban,
} from "lucide-react";

const activityConfig: Record<string, { icon: React.ElementType; color: string }> = {
  created: { icon: Plus, color: "text-primary" },
  sent: { icon: Send, color: "text-blue-500" },
  viewed: { icon: Eye, color: "text-muted-foreground" },
  signed: { icon: CheckCircle, color: "text-green-500" },
  approved: { icon: CheckCircle, color: "text-green-500" },
  declined: { icon: XCircle, color: "text-destructive" },
  reminder: { icon: Clock, color: "text-amber-500" },
  voided: { icon: Ban, color: "text-muted-foreground" },
  expired: { icon: Clock, color: "text-amber-500" },
  commented: { icon: FileText, color: "text-primary" },
};

function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getMockActivities(doc: WorkspaceDocument) {
  const base = [...doc.activities];
  const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };
  if (base.length < 4) {
    base.unshift(
      { id: "mx1", type: "created" as const, actor: doc.owner, timestamp: daysAgo(28), description: "Document created from template" },
      { id: "mx2", type: "viewed" as const, actor: doc.owner, timestamp: daysAgo(25), description: `${doc.owner} viewed the document` },
      { id: "mx3", type: "commented" as const, actor: doc.owner, timestamp: daysAgo(20), description: "Added a comment on section 3.1" },
      { id: "mx4", type: "sent" as const, actor: doc.owner, timestamp: daysAgo(18), description: "Document sent for review" },
      { id: "mx5", type: "viewed" as const, actor: "Sarah Johnson", timestamp: daysAgo(17), description: "Sarah Johnson viewed the document" },
      { id: "mx6", type: "commented" as const, actor: "Sarah Johnson", timestamp: daysAgo(16), description: "Sarah Johnson commented on clause 4.2" },
      { id: "mx7", type: "reminder" as const, actor: "System", timestamp: daysAgo(14), description: "Automated reminder sent to pending signers" },
      { id: "mx8", type: "viewed" as const, actor: "Mike Torres", timestamp: daysAgo(12), description: "Mike Torres viewed the document" },
    );
  }
  return base;
}

export default function DocumentViewActivityPanel({ doc }: { doc: WorkspaceDocument }) {
  const activities = getMockActivities(doc);

  return (
    <div className="relative">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
      {activities.slice().reverse().map((evt) => {
        const cfg = activityConfig[evt.type] || activityConfig.created;
        const Icon = cfg.icon;
        return (
          <div key={evt.id} className="relative pl-7 py-2">
            <div className="absolute left-0 top-3 w-5 h-5 rounded-full bg-card border-2 border-border flex items-center justify-center z-10">
              <Icon size={10} className={cfg.color} />
            </div>
            <p className="text-sm">{evt.description}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{evt.actor} · {formatRelative(evt.timestamp)}</p>
          </div>
        );
      })}
    </div>
  );
}
