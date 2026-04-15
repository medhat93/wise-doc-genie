import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}

export default function RejectDocumentDialog({ open, onClose, onReject }: Props) {
  const [reason, setReason] = useState('');

  const handleReject = () => {
    if (reason.trim()) {
      onReject(reason.trim());
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle size={18} />
            Reject Document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Let the sender know why you're declining to sign this document.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. I disagree with the terms in Section 3…"
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={handleReject}>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
