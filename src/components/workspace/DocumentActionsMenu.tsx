import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Download, Pencil, Share2, Tag, Copy, Users,
  Bell, CalendarDays, CheckCircle, Edit, XCircle, ArrowRight, Lock,
  FileSearch, Trash2, MoreVertical, Link as LinkIcon, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CorrectionDialog from './CorrectionDialog';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';

/* ── helpers ────────────────────────────────────────────────── */
type StageKey = 'draft' | 'approval_waiting' | 'approval_yours' | 'signing_waiting' | 'signing_yours' | 'completed' | 'declined' | 'voided' | 'expired';

function resolveStageKey(doc: WorkspaceDocument): StageKey {
  const s = doc.stage;
  if (s === 'draft') return 'draft';
  if (['approving', 'approved'].includes(s)) {
    return doc.waitingFor?.name === 'Ahmad Medhat' ? 'approval_yours' : 'approval_waiting';
  }
  if (['sent', 'partially_signed', 'waiting', 'expiring'].includes(s)) return 'signing_waiting';
  if (s === 'requires_action') return 'signing_yours';
  if (s === 'completed') return 'completed';
  if (s === 'declined') return 'declined';
  if (s === 'voided') return 'voided';
  if (s === 'expired') return 'expired';
  return 'draft';
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  destructive?: boolean;
  subText?: string;
}

type MenuGroup = MenuItem[];

function getMenuGroups(stageKey: StageKey, doc: WorkspaceDocument, callbacks: {
  onTrash: () => void;
  onVoid: () => void;
  onParticipants?: () => void;
  onRename?: () => void;
  onCorrect?: () => void;
  onFollowUp?: () => void;
  onView?: () => void;
}, isESign: boolean): MenuGroup[] {
  const { onTrash, onVoid, onParticipants, onRename, onCorrect, onFollowUp } = callbacks;

  const view: MenuItem = { label: 'View document', icon: Eye, onClick: callbacks.onView };

  const rename: MenuItem = { label: 'Rename', icon: Pencil, onClick: onRename || (() => toast.success('Document renamed')) };
  const share: MenuItem = { label: 'Share', icon: Share2, onClick: () => toast.success('Share link copied') };
  const download: MenuItem = { label: 'Download', icon: Download, onClick: () => toast.success('Download started') };
  
  const correct: MenuItem = { label: 'Correct', icon: Edit, onClick: onCorrect };
  const updateExp: MenuItem = { label: 'Update expiration', icon: CalendarDays, onClick: () => toast.success('Expiration updated') };
  const markComplete: MenuItem = { label: 'Mark as complete', icon: CheckCircle, onClick: () => toast.success('Document marked as complete') };
  const remind: MenuItem = { label: 'Send reminder', icon: Bell, onClick: () => toast.success(`Reminder sent to ${doc.participants.filter(p => p.status === 'pending').length} pending participants`) };
  const voidDoc: MenuItem = { label: 'Void document', icon: XCircle, destructive: true, subText: 'This cannot be undone', onClick: onVoid };
  const transfer: MenuItem = { label: 'Transfer ownership', icon: ArrowRight, onClick: () => toast.success('Ownership transferred') };
  const audit: MenuItem = { label: 'Audit trail', icon: FileSearch, onClick: () => toast.info('Opening audit trail...') };
  const tags: MenuItem = { label: 'Manage tags', icon: Tag, onClick: () => toast.success('Tags updated') };
  const duplicate: MenuItem = { label: 'Duplicate', icon: Copy, onClick: () => toast.success('Document duplicated') };
  const participants: MenuItem = { label: 'Participants details', icon: Users, onClick: onParticipants };
  const vault: MenuItem = { label: 'Move to vault', icon: Lock, onClick: () => toast.success('Moved to vault') };
  const trash: MenuItem = { label: 'Move to trash', icon: Trash2, destructive: true, onClick: onTrash };
  const followUp: MenuItem = { label: 'Add follow-up', icon: LinkIcon, onClick: onFollowUp };

  const mgmt = [tags, duplicate, participants];

  // Items to exclude in eSign mode
  const esignExclude = new Set(['Correct', 'Transfer ownership', 'Move to vault', 'Audit trail']);

  const filterItems = (items: MenuItem[]): MenuItem[] => {
    if (!isESign) return items;
    return items.filter(item => !esignExclude.has(item.label));
  };

  const filterGroups = (groups: MenuGroup[]): MenuGroup[] => {
    return groups.map(filterItems).filter(g => g.length > 0);
  };

  switch (stageKey) {
    case 'draft':
      return filterGroups([[download, rename, share], mgmt, [trash]]);
    case 'approval_waiting':
      return filterGroups([[view, rename, share], mgmt, [trash]]);
    case 'approval_yours':
      return filterGroups([[view, download, rename, share], mgmt, [trash]]);
    case 'signing_waiting':
      return filterGroups([[view, correct, rename, share], [updateExp, remind, markComplete, voidDoc], mgmt, [audit], [trash]]);
    case 'signing_yours':
      return filterGroups([[view, rename, share], [correct, updateExp, markComplete, voidDoc], mgmt, [audit], [trash]]);
    case 'completed':
      return filterGroups([[view, rename, share], [followUp, transfer, vault, audit], mgmt, [trash]]);
    case 'declined':
      return filterGroups([[view, rename, share], [audit], [tags, participants], [trash]]);
    case 'voided':
      return filterGroups([[view, rename, share], [audit], [tags, participants], [trash]]);
    case 'expired':
      return filterGroups([[view, duplicate, rename, share], [updateExp, audit], mgmt, [trash]]);
  }
}

/* ── exported component ─────────────────────────────────────── */
interface Props {
  doc: WorkspaceDocument;
  trigger?: React.ReactNode;
  onParticipants?: () => void;
  onRename?: () => void;
}

export default function DocumentActionsMenu({ doc, trigger, onParticipants, onRename }: Props) {
  const navigate = useNavigate();
  const { isESign } = useWorkspaceMode();
  const [trashOpen, setTrashOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  const stageKey = resolveStageKey(doc);
  const groups = getMenuGroups(stageKey, doc, {
    onTrash: () => setTrashOpen(true),
    onVoid: () => setVoidOpen(true),
    onParticipants,
    onRename,
    onCorrect: () => setCorrectionOpen(true),
    onFollowUp: () => navigate(`/create?mode=followup&parentId=${doc.id}&childType=supplement`),
  }, isESign);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button variant="ghost" className="h-7 w-7 p-0">
              <MoreVertical size={14} />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {groups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <DropdownMenuSeparator className="my-1 border-border/50" />}
              {group.map(item => (
                <DropdownMenuItem
                  key={item.label}
                  className={`gap-2 px-3 py-2 text-sm ${item.destructive ? 'text-destructive focus:text-destructive' : ''}`}
                  onClick={item.onClick}
                >
                  <item.icon size={16} className={item.destructive ? '' : 'text-muted-foreground'} />
                  <div className="flex-1">
                    <span>{item.label}</span>
                    {item.subText && <p className="text-[10px] text-muted-foreground">{item.subText}</p>}
                  </div>
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Trash confirmation */}
      <AlertDialog open={trashOpen} onOpenChange={setTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>Move "{doc.name}" to trash? You can restore it within 30 days.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toast('Moved to trash', { duration: 5000, action: { label: 'Undo', onClick: () => toast.success('Restored from trash') } })}>
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Void confirmation */}
      <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void "{doc.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will cancel all pending actions. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toast('Document voided', { duration: 5000, action: { label: 'Undo', onClick: () => toast.success('Void undone') } })}>
              Void document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Correction dialog */}
      <CorrectionDialog doc={doc} open={correctionOpen} onOpenChange={setCorrectionOpen} />
    </>
  );
}
