import React from 'react';
import { WorkspaceDocument, DocumentStage } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const BOARD_COLUMNS: { label: string; stages: DocumentStage[]; color: string }[] = [
  { label: 'Draft', stages: ['draft'], color: 'bg-muted' },
  { label: 'Approval Cycle', stages: ['approving', 'approved'], color: 'bg-amber-100' },
  { label: 'In Signing', stages: ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'], color: 'bg-blue-100' },
  { label: 'Signed', stages: ['completed'], color: 'bg-green-100' },
  { label: 'Declined', stages: ['declined'], color: 'bg-red-100' },
  { label: 'Voided', stages: ['voided'], color: 'bg-muted' },
  { label: 'Expired', stages: ['expired'], color: 'bg-muted' },
];

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  documents: WorkspaceDocument[];
  onDocumentClick: (doc: WorkspaceDocument) => void;
}

export default function BoardView({ documents, onDocumentClick }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto p-4 h-full">
      {BOARD_COLUMNS.map((col) => {
        const docs = documents.filter((d) => col.stages.includes(d.stage));
        const visible = docs.slice(0, 5);
        const remaining = docs.length - 5;

        return (
          <div key={col.label} className="flex flex-col w-[260px] min-w-[260px] shrink-0">
            <div className={cn('rounded-t-lg px-3 py-2 flex items-center justify-between', col.color)}>
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{docs.length}</Badge>
            </div>
            <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 overflow-y-auto border border-t-0 border-border">
              {visible.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentClick(doc)}
                  className="w-full text-left bg-background rounded-lg p-3 border border-border hover:shadow-sm transition-shadow space-y-2"
                >
                  <p className="text-sm font-medium leading-tight line-clamp-2">{doc.name}</p>
                  {doc.counterparty && (
                    <p className="text-xs text-muted-foreground">{doc.counterparty}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                    {doc.tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {doc.participants.slice(0, 3).map((p) => (
                        <Avatar key={p.id} className="h-5 w-5 border border-background">
                          <AvatarFallback className="text-[8px]">{p.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {doc.participants.length > 3 && (
                        <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] text-muted-foreground">
                          +{doc.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatRelative(doc.modifiedAt)}</span>
                  </div>
                </button>
              ))}
              {remaining > 0 && (
                <button className="w-full text-center text-xs text-primary py-2 hover:underline">
                  Show all {docs.length}
                </button>
              )}
              {docs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No documents</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
