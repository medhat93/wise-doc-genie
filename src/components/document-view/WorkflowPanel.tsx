import React from "react";
import { WorkspaceDocument } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Circle } from "lucide-react";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentViewWorkflowPanel({ doc }: { doc: WorkspaceDocument }) {
  if (!doc.approvalSteps) return <p className="text-sm text-muted-foreground">No workflow attached to this document.</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow info</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{doc.workflow || "Standard Approval"}</span>
            <Badge className={cn("text-[10px]",
              doc.stage === "completed" ? "bg-green-50 text-green-600" :
              ["approving"].includes(doc.stage) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {doc.stage === "completed" ? "Completed" : ["approving"].includes(doc.stage) ? "In progress" : "Not started"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Started: {formatDate(doc.createdAt)}</p>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Step timeline</p>
        {doc.approvalSteps.map((step, i) => (
          <div key={step.name} className="flex gap-3 pb-3 relative">
            {i < doc.approvalSteps!.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-px border-l border-dashed border-border" />
            )}
            <div className={cn(
              "relative z-10 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0",
              step.status === "completed" && "bg-green-500",
              step.status === "in_progress" && "bg-primary",
              step.status === "pending" && "bg-muted border border-border",
            )}>
              {step.status === "completed" ? <CheckCircle size={10} className="text-white" /> : step.status === "in_progress" ? <Clock size={10} className="text-primary-foreground" /> : <Circle size={10} className="text-muted-foreground" />}
            </div>
            <div className="border rounded-md p-3 flex-1">
              <p className="text-sm font-medium">Step {i + 1} — {step.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.assignee}</p>
              <Badge className={cn("text-[10px] mt-1.5",
                step.status === "completed" ? "bg-green-50 text-green-600" :
                step.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step.status === "completed" ? "Completed" : step.status === "in_progress" ? "In Progress" : "Not Started"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {["approving"].includes(doc.stage) && (
        <>
          <Separator />
          <Button variant="outline" size="sm" className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5">
            Stop workflow
          </Button>
        </>
      )}
    </div>
  );
}
