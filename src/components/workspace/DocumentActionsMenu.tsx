import React, { useState } from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Eye, Download, Pencil, Share2, FolderInput, Tag, Copy, Users,
  Bell, CalendarDays, CheckCircle, Edit, XCircle, ArrowRight, Lock,
  FileSearch, Trash2, MoreVertical,
} from 'lucide-react';

interface Props {
  doc: WorkspaceDocument;
  trigger?: React.ReactNode;
}

export default function DocumentActionsMenu({ doc, trigger }: Props) {
  const [trashOpen, setTrashOpen] = useState(false);

  const stageActions = getStageActions(doc.stage);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <button className="p-1 rounded hover:bg-muted h-7 w-7 flex items-center justify-center">
              <MoreVertical size={14} />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Group 1 — Universal */}
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm">
            <Eye size={16} className="text-muted-foreground" /> Open document
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Download started')}>
            <Download size={16} className="text-muted-foreground" /> Download PDF + audit trail
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Document renamed')}>
            <Pencil size={16} className="text-muted-foreground" /> Rename document
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Share link copied')}>
            <Share2 size={16} className="text-muted-foreground" /> Share with team members
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 border-border/50" />

          {/* Group 2 — Document Management */}
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Moved to folder')}>
            <FolderInput size={16} className="text-muted-foreground" /> Move to folder
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Tags updated')}>
            <Tag size={16} className="text-muted-foreground" /> Add or remove tags
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm" onClick={() => toast.success('Document duplicated')}>
            <Copy size={16} className="text-muted-foreground" /> Create a copy
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 px-3 py-2 text-sm">
            <Users size={16} className="text-muted-foreground" /> View participants
          </DropdownMenuItem>

          {stageActions.length > 0 && (
            <>
              <DropdownMenuSeparator className="my-1 border-border/50" />
              {stageActions.map(action => (
                <DropdownMenuItem
                  key={action.label}
                  className="gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    if (action.label === 'Cancel and void this request') {
                      toast('Document voided', {
                        description: 'Undo',
                        duration: 5000,
                        action: { label: 'Undo', onClick: () => toast.success('Void undone') },
                      });
                    } else {
                      toast.success(action.toast);
                    }
                  }}
                >
                  <action.icon size={16} className="text-muted-foreground" /> {action.label}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator className="my-1 border-border/50" />

          {/* Group 4 — Destructive */}
          <DropdownMenuItem
            className="gap-2 px-3 py-2 text-sm text-destructive focus:text-destructive"
            onClick={() => setTrashOpen(true)}
          >
            <Trash2 size={16} /> Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={trashOpen} onOpenChange={setTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Move "{doc.name}" to trash? You can restore it within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast('Moved to trash', {
                  duration: 5000,
                  action: { label: 'Undo', onClick: () => toast.success('Restored from trash') },
                });
              }}
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getStageActions(stage: string) {
  const actions: { label: string; icon: React.ElementType; toast: string }[] = [];

  if (['approving', 'approved'].includes(stage)) {
    actions.push(
      { label: 'Remind pending approvers', icon: Bell, toast: 'Reminder sent to pending approvers' },
      { label: 'Change expiration date', icon: CalendarDays, toast: 'Expiration updated' },
      { label: 'Manually mark as completed', icon: CheckCircle, toast: 'Document marked as completed' },
    );
  } else if (['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(stage)) {
    actions.push(
      { label: 'Modify recipients or fields', icon: Edit, toast: 'Document correction started' },
      { label: 'Remind pending signers', icon: Bell, toast: 'Reminder sent to pending signers' },
      { label: 'Change expiration date', icon: CalendarDays, toast: 'Expiration updated' },
      { label: 'Manually mark as completed', icon: CheckCircle, toast: 'Document marked as completed' },
      { label: 'Cancel and void this request', icon: XCircle, toast: 'Document voided' },
    );
  } else if (stage === 'completed') {
    actions.push(
      { label: 'Transfer to another member', icon: ArrowRight, toast: 'Ownership transferred' },
      { label: 'Archive in the vault', icon: Lock, toast: 'Moved to vault' },
      { label: 'View detailed audit history', icon: FileSearch, toast: '' },
    );
  } else if (['declined', 'voided', 'expired'].includes(stage)) {
    actions.push(
      { label: 'View audit history', icon: FileSearch, toast: '' },
    );
  }

  return actions;
}
