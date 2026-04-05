import React from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Pencil, Mail, AlertTriangle } from 'lucide-react';

interface Props {
  doc: WorkspaceDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CorrectionDialog({ doc, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  if (!doc) return null;

  const signed = doc.participants.filter(p => p.status === 'signed');
  const pending = doc.participants.filter(p => p.status !== 'signed' && p.role !== 'viewer');
  const ccs = doc.participants.filter(p => p.role === 'viewer');
  const hasSigned = signed.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Correct signature request</DialogTitle>
          <DialogDescription>Modify participants, documents, or fields on this in-progress request</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Signed participants */}
          {signed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Lock size={14} className="text-muted-foreground" />
                Locked — Signed participants
              </p>
              <div className="space-y-1.5 pl-5">
                {signed.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Lock size={12} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.email}</span>
                    {p.signedAt && (
                      <span className="text-xs text-green-600 ml-auto">
                        Signed on {new Date(p.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic">Signed participants and their annotations cannot be modified</p>
              </div>
            </div>
          )}

          {/* Pending participants */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Pencil size={14} className="text-muted-foreground" />
                Editable — Pending participants
              </p>
              <div className="space-y-1.5 pl-5">
                {pending.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Pencil size={12} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.email}</span>
                    <span className="text-xs text-amber-600 ml-auto">Pending</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">These participants can be fully modified, removed, or reordered</p>
              </div>
            </div>
          )}

          {/* CC participants */}
          {ccs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Mail size={14} className="text-muted-foreground" />
                CC — No impact
              </p>
              <div className="space-y-1.5 pl-5">
                {ccs.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Mail size={12} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning banner */}
          {hasSigned && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                All previously sent documents are now merged into a locked block. You can only add new documents after the locked block.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            onOpenChange(false);
            navigate(`/create?mode=correction&id=${doc.id}`);
          }}>
            Enter correction mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
