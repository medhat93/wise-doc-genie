import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { SigningDocument, SIGNING_DOCUMENTS } from './signingDocuments';

interface Props {
  open: boolean;
  onClose: () => void;
  onGoToDoc: (id: string) => void;
  acceptedDocs: Set<string>;
  signed: boolean;
}

export default function SigningRequirementsDialog({ open, onClose, onGoToDoc, acceptedDocs, signed }: Props) {
  const items = SIGNING_DOCUMENTS.filter(d => d.ack !== 'none').map(doc => {
    if (doc.ack === 'sign') {
      return { doc, done: signed, label: `Complete signature fields on ${doc.name}` };
    }
    return { doc, done: acceptedDocs.has(doc.id), label: `Accept ${doc.name}` };
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Complete all documents first</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {items.map(({ doc, done, label }) => (
            <div key={doc.id} className="flex items-start gap-3 p-2 rounded-lg border border-border">
              {done ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {!done && (
                  <button
                    onClick={() => { onGoToDoc(doc.id); onClose(); }}
                    className="text-xs text-primary hover:underline mt-0.5"
                  >
                    Go to document →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
