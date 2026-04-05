import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2 } from 'lucide-react';
import { SIGNING_DOCUMENTS } from './signingDocuments';

interface Props {
  onGoBack: () => void;
  acceptedDocs: Set<string>;
  signed: boolean;
}

export default function SigningComplete({ onGoBack, acceptedDocs, signed }: Props) {
  useEffect(() => {
    const t = setTimeout(onGoBack, 5000);
    return () => clearTimeout(t);
  }, [onGoBack]);

  const getStatusLabel = (doc: typeof SIGNING_DOCUMENTS[0]) => {
    if (doc.ack === 'sign') return signed ? 'Signed' : 'Pending';
    if (doc.ack === 'must_view_accept') return acceptedDocs.has(doc.id) ? 'Accepted' : 'Pending';
    return 'No action needed';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-4 animate-scale-in max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold">All documents reviewed & signed!</h2>
        <p className="text-muted-foreground">You reviewed {SIGNING_DOCUMENTS.length} documents and completed your signature</p>

        <div className="bg-card border border-border rounded-lg p-4 text-left space-y-2 mt-4">
          {SIGNING_DOCUMENTS.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <span className="flex-1 truncate">{doc.name}</span>
              <span className="text-xs text-muted-foreground">{getStatusLabel(doc)}</span>
            </div>
          ))}
        </div>

        <Button onClick={onGoBack} className="mt-4">
          Back to workspace
        </Button>
      </div>
    </div>
  );
}
