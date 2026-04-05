import React from 'react';
import { WorkspaceDocument, DocumentStage } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Check, X, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const PIPELINE: { label: string; stages: DocumentStage[] }[] = [
  { label: 'Draft', stages: ['draft'] },
  { label: 'Approval', stages: ['approving', 'approved'] },
  { label: 'Signing', stages: ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'] },
  { label: 'Completed', stages: ['completed'] },
];

const FAILED_STAGES: DocumentStage[] = ['declined', 'voided', 'expired'];

function getStageIndex(stage: DocumentStage): number {
  if (FAILED_STAGES.includes(stage)) return -1;
  return PIPELINE.findIndex((p) => p.stages.includes(stage));
}

export default function StageTracker({ doc }: { doc: WorkspaceDocument }) {
  const isFailed = FAILED_STAGES.includes(doc.stage);
  const currentIdx = getStageIndex(doc.stage);
  // For failed, find the step where it failed (signing step usually)
  const failedAtIdx = isFailed ? 2 : -1;

  return (
    <div className="flex items-center gap-1">
      {PIPELINE.map((step, i) => {
        const isCompleted = !isFailed && i < currentIdx;
        const isCurrent = !isFailed && i === currentIdx;
        const isFailedStep = isFailed && i === failedAtIdx;
        const isFuture = !isFailed && i > currentIdx;

        return (
          <React.Fragment key={step.label}>
            {i > 0 && (
              <div className={cn('h-px w-3', isCompleted ? 'bg-green-500' : isFailedStep || (isFailed && i < failedAtIdx) ? 'bg-red-400' : 'bg-border')} />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center">
                  {isCompleted ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative">
                      <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-primary/40 animate-ping" />
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary" />
                    </div>
                  ) : isFailedStep ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-red-500 flex items-center justify-center">
                      <X size={8} className="text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <Circle size={10} className={cn('text-border', isFailed && i < failedAtIdx && 'text-red-300')} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {step.label}
                {isCurrent && ` (Current)`}
                {isCompleted && ` ✓`}
                {isFailedStep && ` — ${doc.stage}`}
              </TooltipContent>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
}
