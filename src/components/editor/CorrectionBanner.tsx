import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  mode: 'correction' | 'followup';
  parentName?: string;
  childType?: string;
}

export default function CorrectionBanner({ mode, parentName, childType }: Props) {
  const navigate = useNavigate();
  const [saveOpen, setSaveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  if (mode === 'followup') {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-300 dark:border-blue-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300">
          <span>📎</span>
          Adding {childType || 'document'} to {parentName || 'parent document'}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => {
            toast.success('Follow-up saved and sent');
            navigate('/');
          }}>
            Save & send
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
            navigate('/');
            toast('Follow-up cancelled');
          }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle size={16} />
          You are correcting this signature request. Signers cannot sign until you save or discard.
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => setSaveOpen(true)}>Save changes</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDiscardOpen(true)}>Discard</Button>
        </div>
      </div>

      {/* Save confirmation */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Save corrections?</DialogTitle>
            <DialogDescription>Your changes will be applied. New signers and signers with updated sending methods will receive new signing links.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary of changes</p>
            <ul className="text-sm space-y-1 text-foreground/80">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Added 1 document: Amendment #1
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Added 1 participant: Lisa Chen
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Modified 3 annotations
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setSaveOpen(false);
              toast.success('Corrections saved');
              navigate('/');
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard confirmation */}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>All changes will be lost. The signature request will return to its previous state.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>Keep editing</Button>
            <Button variant="destructive" onClick={() => {
              setDiscardOpen(false);
              toast('Changes discarded');
              navigate('/');
            }}>Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
