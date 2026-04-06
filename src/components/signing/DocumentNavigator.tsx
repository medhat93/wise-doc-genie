import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, PenTool } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SigningDocument } from './signingDocuments';

interface Props {
  documents: SigningDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  signedFieldCount: number;
}

const typeBadgeClass: Record<string, string> = {
  primary: 'bg-indigo-100 text-indigo-700',
  supplement: 'bg-amber-100 text-amber-700',
};

export default function DocumentNavigator({ documents, activeDocId, onSelectDoc, signedFieldCount }: Props) {
  const getStatusInfo = (doc: SigningDocument) => {
    if (doc.ack === 'sign') {
      const total = doc.fieldCount || 0;
      if (signedFieldCount >= total) return { icon: <CheckCircle2 size={10} className="text-green-600" />, text: 'Signed', color: 'text-green-600' };
      return { icon: <PenTool size={10} className="text-primary" />, text: `${total} fields to complete`, color: 'text-primary' };
    }
    return { icon: <CheckCircle2 size={10} className="text-muted-foreground/60" />, text: 'No action needed', color: 'text-muted-foreground/60' };
  };

  const reviewedCount = documents.filter(d => {
    if (d.ack === 'sign') return signedFieldCount >= (d.fieldCount || 0);
    return true;
  }).length;

  const progressPct = (reviewedCount / documents.length) * 100;

  return (
    <div className="w-[220px] border-r border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Documents</span>
          <span className="text-xs text-muted-foreground">{reviewedCount} of {documents.length} reviewed</span>
        </div>
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-2">
        {documents.map(doc => {
          const active = doc.id === activeDocId;
          const status = getStatusInfo(doc);
          return (
            <button
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={cn(
                'w-full text-left border rounded-md p-2.5 mb-2 cursor-pointer transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:bg-muted/50'
              )}
            >
              <p className="text-xs font-medium line-clamp-2">{doc.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn('text-[9px] px-1 rounded font-medium', typeBadgeClass[doc.type])}>
                  {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                </span>
                <span className="text-[10px] text-muted-foreground">{doc.pages} pg</span>
              </div>
              <div className={cn('flex items-center gap-1 mt-1.5', status.color)}>
                {status.icon}
                <span className="text-[10px]">{status.text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
