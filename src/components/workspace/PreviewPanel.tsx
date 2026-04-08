import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  X, Send, Download, Pencil, MoreVertical, Clock, FileText, Eye,
  PenTool, Bell, XCircle, Plus, CheckCircle, Circle, GitPullRequest,
  Users, File, AlertTriangle, Ban, Lock, Copy, Check, ChevronDown, ChevronUp, Sparkles, Edit,
  Link as LinkIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import DocumentActionsMenu from './DocumentActionsMenu';
import CorrectionDialog from './CorrectionDialog';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';

/* ── stage badge config ─────────────────────────────────────── */
const stageConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:             { label: 'Draft',     className: 'bg-muted text-muted-foreground',                             icon: Pencil },
  approving:         { label: 'Approval',  className: 'bg-blue-50 text-blue-600 border border-blue-200',            icon: Circle },
  approved:          { label: 'Approved',  className: 'bg-blue-50 text-blue-600 border border-blue-200',            icon: Circle },
  sent:              { label: 'Signing',   className: 'bg-primary/5 text-primary border border-primary/20',          icon: PenTool },
  partially_signed:  { label: 'Signing',   className: 'bg-primary/5 text-primary border border-primary/20',          icon: PenTool },
  waiting:           { label: 'Signing',   className: 'bg-primary/5 text-primary border border-primary/20',          icon: PenTool },
  requires_action:   { label: 'Signing',   className: 'bg-primary/5 text-primary border border-primary/20',          icon: PenTool },
  expiring:          { label: 'Expiring',  className: 'bg-amber-50 text-amber-600 border border-amber-200',         icon: AlertTriangle },
  completed:         { label: 'Completed', className: 'bg-green-50 text-green-600 border border-green-200',          icon: CheckCircle },
  declined:          { label: 'Declined',  className: 'bg-destructive/5 text-destructive',                           icon: XCircle },
  voided:            { label: 'Voided',    className: 'bg-muted text-muted-foreground',                              icon: Ban },
  expired:           { label: 'Expired',   className: 'bg-amber-50 text-amber-600',                                  icon: AlertTriangle },
};

const activityConfig: Record<string, { icon: React.ElementType; color: string }> = {
  created:   { icon: Plus,        color: 'text-primary' },
  sent:      { icon: Send,        color: 'text-blue-500' },
  viewed:    { icon: Eye,         color: 'text-muted-foreground' },
  signed:    { icon: CheckCircle, color: 'text-green-500' },
  approved:  { icon: CheckCircle, color: 'text-green-500' },
  declined:  { icon: XCircle,     color: 'text-destructive' },
  reminder:  { icon: Clock,       color: 'text-amber-500' },
  voided:    { icon: Ban,         color: 'text-muted-foreground' },
  expired:   { icon: Clock,       color: 'text-amber-500' },
  commented: { icon: FileText,    color: 'text-primary' },
};

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function daysSince(ts: string): number {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
}

/* ── MOCK EXTENDED ACTIVITIES ─────────────────────────────────── */
function getMockActivities(doc: WorkspaceDocument) {
  const base = [...doc.activities];
  const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };
  if (base.length < 4) {
    base.unshift(
      { id: 'mx1', type: 'created' as const, actor: doc.owner, timestamp: daysAgo(28), description: 'Document created from template' },
      { id: 'mx2', type: 'viewed' as const, actor: doc.owner, timestamp: daysAgo(25), description: `${doc.owner} viewed the document` },
      { id: 'mx3', type: 'commented' as const, actor: doc.owner, timestamp: daysAgo(20), description: 'Added a comment on section 3.1' },
      { id: 'mx4', type: 'sent' as const, actor: doc.owner, timestamp: daysAgo(18), description: 'Document sent for review' },
      { id: 'mx5', type: 'viewed' as const, actor: 'Sarah Johnson', timestamp: daysAgo(17), description: 'Sarah Johnson viewed the document' },
      { id: 'mx6', type: 'commented' as const, actor: 'Sarah Johnson', timestamp: daysAgo(16), description: 'Sarah Johnson commented on clause 4.2' },
      { id: 'mx7', type: 'reminder' as const, actor: 'System', timestamp: daysAgo(14), description: 'Automated reminder sent to pending signers' },
      { id: 'mx8', type: 'viewed' as const, actor: 'Mike Torres', timestamp: daysAgo(12), description: 'Mike Torres viewed the document' },
    );
  }
  return base;
}

/* ── MOCK DOCUMENTS TAB DATA ──────────────────────────────────── */
interface SubDocument {
  id: string;
  name: string;
  type: 'Primary' | 'Supplement' | 'Attachment';
  pages: number;
  visibleTo?: string[] | 'all';
}

function getMockSubDocuments(_doc: WorkspaceDocument): SubDocument[] {
  return [
    { id: 'd1', name: 'Master Services Agreement', type: 'Primary', pages: 8, visibleTo: 'all' },
    { id: 'd2', name: 'Schedule A — Pricing & Fee Structure', type: 'Supplement', pages: 3, visibleTo: ['Ahmad Medhat', 'Sarah Johnson'] },
    { id: 'd3', name: 'Confidential Financial Terms', type: 'Supplement', pages: 2, visibleTo: ['Ahmad Medhat'] },
    { id: 'd4', name: 'Insurance Certificate', type: 'Attachment', pages: 1, visibleTo: 'all' },
  ];
}

/* ── MOCK PARTICIPANT COLORS ──────────────────────────────────── */
const participantColors: Record<string, string> = {
  'Ahmad Medhat': 'bg-blue-500',
  'Sarah Johnson': 'bg-rose-500',
  'Mike Torres': 'bg-amber-500',
  'Pepper Potts': 'bg-purple-500',
  'Bruce Wayne': 'bg-slate-700',
  'Lisa Chen': 'bg-teal-500',
  'David Park': 'bg-indigo-500',
  'John Smith': 'bg-emerald-500',
};

/* ── AI SUMMARY ───────────────────────────────────────────────── */
function getAISummary(doc: WorkspaceDocument): string {
  const signers = doc.participants.filter(p => p.role === 'signer');
  const signed = signers.filter(p => p.status === 'signed');
  
  if (doc.stage === 'draft') {
    return `${doc.category} with ${doc.counterparty || 'counterparty'} covering ${doc.category.toLowerCase()} services. No signatures collected yet.`;
  }
  if (['approving', 'approved'].includes(doc.stage)) {
    const completedSteps = doc.approvalSteps?.filter(s => s.status === 'completed').length || 0;
    const totalSteps = doc.approvalSteps?.length || 0;
    return `${doc.category} with ${doc.counterparty || 'counterparty'} currently in ${doc.workflowStep || 'approval'} stage. ${completedSteps} of ${totalSteps} approval steps completed.`;
  }
  if (['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(doc.stage)) {
    return `${doc.category} with ${doc.counterparty || 'counterparty'} awaiting ${doc.waitingFor?.name ? `${doc.waitingFor.name}'s` : 'a'} signature. ${signed.length} of ${signers.length} signer${signers.length > 1 ? 's' : ''} ha${signed.length === 1 ? 's' : 've'} completed.`;
  }
  if (doc.stage === 'completed') {
    const lastSigned = signers.find(p => p.signedAt)?.signedAt;
    return `Fully executed ${doc.category.toLowerCase()} with ${doc.counterparty || 'counterparty'}. All ${signers.length} part${signers.length > 1 ? 'ies' : 'y'} signed${lastSigned ? ` on ${formatDate(lastSigned)}` : ''}.`;
  }
  if (doc.stage === 'declined') {
    return `${doc.category} declined by the counterparty. Reason: terms not acceptable.`;
  }
  if (doc.stage === 'voided') {
    return `${doc.category} was voided. Document is no longer active.`;
  }
  if (doc.stage === 'expired') {
    return `${doc.category} expired without completion. Consider resending with a new expiration date.`;
  }
  return `${doc.category} with ${doc.counterparty || 'counterparty'}.`;
}

/* ── JIRA-STYLE PROPERTY ROW ──────────────────────────────────── */
function PropertyRow({ label, value, readOnly, type = 'text', options, onSave }: {
  label: string;
  value: string;
  readOnly?: boolean;
  type?: 'text' | 'select' | 'date' | 'number';
  options?: string[];
  onSave?: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (editValue !== value) {
      onSave?.(editValue);
      toast.success(`${label} updated`);
    }
  };

  if (readOnly) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <span className="text-sm text-muted-foreground/80 flex-1">{value || '—'}</span>
      </div>
    );
  }

  if (editing && type === 'select' && options) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2 bg-muted/50 rounded-md">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <Select value={editValue} onValueChange={(v) => { setEditValue(v); setEditing(false); onSave?.(v); toast.success(`${label} updated`); }}>
          <SelectTrigger className="h-7 text-sm flex-1 border-primary/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setEditing(false)}>
          <X size={12} />
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2 bg-muted/50 rounded-md">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <input
          ref={inputRef}
          type={type === 'number' ? 'text' : type === 'date' ? 'date' : 'text'}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          onBlur={save}
          className="flex-1 text-sm bg-transparent border-b border-primary/40 outline-none py-0.5"
        />
        <button className="ml-1 text-primary" onClick={save}><Check size={12} /></button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center min-h-[32px] px-2 -mx-2 hover:bg-muted/50 rounded-md cursor-pointer group"
      onClick={() => setEditing(true)}
    >
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
      <span className="text-sm text-foreground flex-1 border-b border-dashed border-transparent group-hover:border-muted-foreground/30">
        {type === 'number' && value ? `SAR ${value}` : value || '—'}
      </span>
    </div>
  );
}

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
interface Props {
  document: WorkspaceDocument | null;
  onClose: () => void;
}

export default function PreviewPanel({ document: doc, onClose }: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Property state
  const [docType, setDocType] = useState('');
  const [department, setDepartment] = useState('Legal');
  const [priority, setPriority] = useState('Medium');
  const [contractValue, setContractValue] = useState('');
  const [folder, setFolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (doc) {
      setDocType(doc.category === 'Contract' ? 'Service Agreement' : doc.category === 'NDA' ? 'NDA' : doc.category === 'Agreement' ? 'Consulting' : 'Other');
      setContractValue(doc.value?.replace('SAR ', '').replace(',', '') || '');
      setFolder(doc.folder || '');
      setExpiryDate(doc.expiresAt ? new Date(doc.expiresAt).toISOString().split('T')[0] : '');
    }
  }, [doc]);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  if (!doc) return null;
  const stage = stageConfig[doc.stage] ?? stageConfig.draft;
  const StageIcon = stage.icon;
  const activities = getMockActivities(doc);
  const subDocs = getMockSubDocuments(doc);
  const hasWorkflow = !!doc.approvalSteps;

  const isYourAction = doc.stage === 'requires_action' || (doc.waitingFor?.name === 'Ahmad Medhat');
  const isApproval = ['approving', 'approved'].includes(doc.stage);
  const isSigning = ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(doc.stage);

  const handleRename = () => {
    setIsRenaming(true);
    setRenameValue(doc.name);
  };

  const commitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== doc.name) {
      toast.success('Document renamed');
    }
  };

  /* ── FIX 6: Simplified action buttons — 1 primary + more ── */
  function renderActionButtons() {
    const moreMenu = (
      <DocumentActionsMenu
        doc={doc}
        onRename={handleRename}
        onParticipants={() => setActiveTab('participants')}
        trigger={<Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical size={14} /></Button>}
      />
    );

    if (doc.stage === 'draft') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => navigate('/editor')}><Pencil size={12} /> Edit</Button>
          {moreMenu}
        </>
      );
    }
    if (isApproval && isYourAction) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Document approved')}><Check size={12} /> Approve</Button>
          <Button variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => toast.error('Document rejected')}><XCircle size={12} /> Reject</Button>
          {moreMenu}
        </>
      );
    }
    if (isApproval) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Reminder sent')}><Bell size={12} /> Remind</Button>
          {moreMenu}
        </>
      );
    }
    if (isSigning && isYourAction) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => navigate(`/signing/${doc.id}`)}><PenTool size={12} /> Sign</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => setCorrectionOpen(true)}><Edit size={12} /> Correct</Button>
          {moreMenu}
        </>
      );
    }
    if (isSigning) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Reminder sent')}><Bell size={12} /> Remind</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => setCorrectionOpen(true)}><Edit size={12} /> Correct</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'completed') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate(`/create?mode=followup&parentId=${doc.id}&childType=supplement`)}><LinkIcon size={12} /> Follow-up</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'declined' || doc.stage === 'voided') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Document duplicated')}><Copy size={12} /> Duplicate</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'expired') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Document resent')}><Send size={12} /> Resend</Button>
          {moreMenu}
        </>
      );
    }
    return (
      <>
        <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
        {moreMenu}
      </>
    );
  }

  /* ── Documents summary ── */
  const docTypeCounts = subDocs.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const docSummaryParts = Object.entries(docTypeCounts).map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`);

  return (
    <>
    <Sheet open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[400px] p-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-2 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <Input
                  ref={renameRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                  className="text-lg font-semibold h-auto p-0 border-0 border-b-2 border-primary rounded-none focus-visible:ring-0 shadow-none"
                />
              ) : (
                <h3 className="text-lg font-semibold leading-tight line-clamp-2">{doc.name}</h3>
              )}
              {doc.counterparty && <p className="text-sm text-muted-foreground mt-0.5">{doc.counterparty}</p>}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1 h-7 w-7" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <Badge className={cn('rounded-full h-6 px-2 text-[11px] gap-1', stage.className)}>
            <StageIcon size={12} />
            {stage.label}
          </Badge>
          <div className="flex items-center gap-1 mt-3">
            {renderActionButtons()}
          </div>
        </div>

        {/* FIX 1: AI Summary — above tabs, always visible */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="bg-violet-50/50 rounded-md p-2.5 border border-violet-100 flex gap-2">
            <Sparkles size={14} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {getAISummary(doc)}
                <span className="text-[9px] text-violet-400 italic ml-1">AI generated</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 border-b border-border shrink-0">
            <TabsList className="w-full justify-start h-9 bg-transparent p-0 gap-4">
              <TabsTrigger value="overview" className="text-xs gap-1 rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground hover:text-foreground">
                <FileText size={12} /> Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1 rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground hover:text-foreground">
                <Clock size={12} /> Activity
              </TabsTrigger>
              <TabsTrigger value="participants" className="text-xs gap-1 rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground hover:text-foreground">
                <Users size={12} /> Participants
              </TabsTrigger>
              {hasWorkflow && (
                <TabsTrigger value="workflow" className="text-xs gap-1 rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground hover:text-foreground">
                  <GitPullRequest size={12} /> Workflow
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ═══ TAB 1: OVERVIEW ═══ */}
            <TabsContent value="overview" className="p-4 space-y-4 mt-0">
              {/* Follow-up parent link */}
              {doc.followUpTo && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <span>🔗</span>
                  <span className="text-muted-foreground">Parent document:</span>
                  <button className="text-primary hover:underline font-medium" onClick={() => toast.info(`Open ${doc.followUpTo!.name}`)}>
                    {doc.followUpTo.name}
                  </button>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Completed</Badge>
                </div>
              )}

              {/* FIX 2: Documents section — collapsed by default */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2"
                  onClick={() => setDocsExpanded(!docsExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <File size={14} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{subDocs.length} documents</p>
                      <p className="text-[10px] text-muted-foreground">{docSummaryParts.join(' · ')}</p>
                    </div>
                  </div>
                  {docsExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    docsExpanded ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                  )}
                >
                  {subDocs.map(sd => {
                    const typeColors = { Primary: 'bg-indigo-100 text-indigo-700', Supplement: 'bg-amber-100 text-amber-700', Attachment: 'bg-gray-100 text-gray-700' };
                    const isSub = sd.type !== 'Primary';
                    const hasRestriction = sd.visibleTo !== 'all' && Array.isArray(sd.visibleTo);
                    return (
                      <div
                        key={sd.id}
                        onClick={() => toast.info(`Open ${sd.name}`)}
                        className={cn(
                          'py-2.5 border-b border-border/30 cursor-pointer hover:bg-muted/30 transition-colors rounded-sm',
                          isSub && 'pl-3 border-l-2',
                          sd.type === 'Supplement' && 'border-l-amber-400',
                          sd.type === 'Attachment' && 'border-l-gray-400',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <File size={16} className={cn('shrink-0', sd.type === 'Primary' ? 'text-red-500' : sd.type === 'Supplement' ? 'text-blue-500' : 'text-green-500')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sd.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn('text-[10px] px-1.5 rounded font-medium', typeColors[sd.type])}>{sd.type}</span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">{sd.pages} {sd.pages === 1 ? 'page' : 'pages'}</span>
                            </div>
                          </div>
                        </div>
                        {hasRestriction && (
                          <div className="ml-7 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Eye size={10} className="shrink-0" />
                              {(sd.visibleTo as string[]).map((name, i) => (
                                <React.Fragment key={name}>
                                  {i > 0 && <span>,</span>}
                                  <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', participantColors[name] || 'bg-muted-foreground')} />
                                  <span>{name}{(sd.visibleTo as string[]).length === 1 ? ' only' : ''}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* FIX 3: Jira-style inline properties — replaces Key Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Properties</p>
                <div className="space-y-0.5">
                  <PropertyRow
                    label="Document type"
                    value={docType}
                    type="select"
                    options={['Service Agreement', 'NDA', 'Employment', 'Consulting', 'Procurement', 'Lease', 'Partnership', 'Other']}
                    onSave={setDocType}
                  />
                  <PropertyRow label="Counterparty" value={doc.counterparty || ''} onSave={() => {}} />
                  <PropertyRow label="Sender" value={doc.owner} readOnly />
                  <PropertyRow label="Created" value={formatDate(doc.createdAt)} readOnly />
                  <PropertyRow label="Last modified" value={formatDate(doc.modifiedAt)} readOnly />
                  <PropertyRow label="Expiry date" value={expiryDate} type="date" onSave={setExpiryDate} />
                  <PropertyRow label="Folder" value={folder} onSave={setFolder} />
                  <PropertyRow label="Contract value" value={contractValue} type="number" onSave={setContractValue} />
                  <PropertyRow
                    label="Department"
                    value={department}
                    type="select"
                    options={['Legal', 'Finance', 'HR', 'Engineering', 'Sales', 'Procurement']}
                    onSave={setDepartment}
                  />
                  <PropertyRow
                    label="Priority"
                    value={priority}
                    type="select"
                    options={['Low', 'Medium', 'High', 'Critical']}
                    onSave={setPriority}
                  />
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.length > 0 ? doc.tags.map(t => (
                    <span key={t} className="group bg-muted border border-border text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                      {t}
                      <X size={10} className="opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground hover:text-foreground transition-opacity" />
                    </span>
                  )) : null}
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border px-2 py-0.5 rounded-md transition-colors">
                    <Plus size={10} /> Add
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* ═══ TAB 2: ACTIVITY — FIX 4: full log, no truncation ═══ */}
            <TabsContent value="activity" className="p-4 mt-0">
              <div className="relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                {activities.slice().reverse().map(evt => {
                  const cfg = activityConfig[evt.type] || activityConfig.created;
                  const Icon = cfg.icon;
                  return (
                    <div key={evt.id} className="relative pl-7 py-2">
                      <div className="absolute left-0 top-3 w-5 h-5 rounded-full bg-card border-2 border-border flex items-center justify-center z-10">
                        <Icon size={10} className={cfg.color} />
                      </div>
                      <p className="text-sm">{evt.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{evt.actor} · {formatRelative(evt.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* ═══ TAB 3: PARTICIPANTS — FIX 5: Signing Timeline ═══ */}
            <TabsContent value="participants" className="p-4 mt-0 space-y-4">
              <SigningTimeline doc={doc} />
            </TabsContent>

            {/* ═══ TAB 4: WORKFLOW ═══ */}
            {hasWorkflow && (
              <TabsContent value="workflow" className="p-4 mt-0 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow Info</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.workflow || 'Standard Approval'}</span>
                      <Badge className={cn('text-[10px]',
                        doc.stage === 'completed' ? 'bg-green-50 text-green-600' :
                        ['approving'].includes(doc.stage) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {doc.stage === 'completed' ? 'Completed' : ['approving'].includes(doc.stage) ? 'In progress' : 'Not started'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Started: {formatDate(doc.createdAt)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Step Timeline</p>
                  {doc.approvalSteps?.map((step, i) => (
                    <div key={step.name} className="flex gap-3 pb-3 relative">
                      {i < (doc.approvalSteps?.length ?? 0) - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-px border-l border-dashed border-border" />
                      )}
                      <div className={cn(
                        'relative z-10 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                        step.status === 'completed' && 'bg-green-500',
                        step.status === 'in_progress' && 'bg-primary',
                        step.status === 'pending' && 'bg-muted border border-border',
                      )}>
                        {step.status === 'completed' ? (
                          <CheckCircle size={10} className="text-white" />
                        ) : step.status === 'in_progress' ? (
                          <Clock size={10} className="text-primary-foreground" />
                        ) : (
                          <Circle size={10} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="border rounded-md p-3 flex-1">
                        <p className="text-sm font-medium">Step {i + 1} — {step.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.assignee}</p>
                        <Badge className={cn('text-[10px] mt-1.5',
                          step.status === 'completed' ? 'bg-green-50 text-green-600' :
                          step.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {step.status === 'completed' ? 'Completed' : step.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {['approving'].includes(doc.stage) && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5">Stop workflow</Button>
                    </div>
                  </>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
    
    <CorrectionDialog doc={doc} open={correctionOpen} onOpenChange={setCorrectionOpen} />
    </>
  );
}

/* ── SIGNING TIMELINE SUB-COMPONENT ───────────────────────────── */
function SigningTimeline({ doc }: { doc: WorkspaceDocument }) {
  const allParticipants = doc.participants;
  const signers = allParticipants.filter(p => p.role === 'signer');
  const approvers = allParticipants.filter(p => p.role === 'approver');
  const viewers = allParticipants.filter(p => p.role === 'viewer');
  const isApproval = ['approving', 'approved'].includes(doc.stage);
  const isSigning = ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(doc.stage);

  // For signing/approval — use sequential timeline
  const isSequential = isSigning || isApproval;
  const timelineParticipants = isApproval ? [...approvers, ...signers] : [...signers];
  const actionLabel = isApproval ? 'approved' : 'signed';
  const totalAction = timelineParticipants.length;
  const completedCount = timelineParticipants.filter(p => p.status === 'signed').length;
  const progressPercent = totalAction > 0 ? (completedCount / totalAction) * 100 : 0;

  const getNodeStatus = (p: typeof allParticipants[0]) => {
    if (p.status === 'signed') return 'completed';
    if (p.status === 'declined') return 'declined';
    if (p.status === 'viewed' || p.status === 'pending') {
      // Check if this is the "current" one we're waiting on
      if (doc.waitingFor?.name === p.name) return 'current';
      if (p.status === 'viewed') return 'current';
    }
    return 'pending';
  };

  if (isSequential && timelineParticipants.length > 0) {
    return (
      <div className="space-y-4">
        <div className="relative">
          {timelineParticipants.map((p, i) => {
            const status = getNodeStatus(p);
            const isLast = i === timelineParticipants.length - 1;
            const color = participantColors[p.name] || 'bg-muted-foreground';

            return (
              <div key={p.id} className="flex gap-3 relative group">
                {/* Connector line */}
                {!isLast && (
                  <div className={cn(
                    'absolute left-[11px] top-8 bottom-0 w-0.5',
                    status === 'completed' ? 'bg-green-500' :
                    status === 'current' ? 'bg-gradient-to-b from-green-500 to-primary' :
                    'border-l-2 border-dashed border-border bg-transparent',
                  )} />
                )}

                {/* Step label */}
                <div className="absolute -left-1 top-1 text-[9px] text-muted-foreground w-6 text-right hidden">
                  {i + 1}
                </div>

                {/* Node */}
                <div className={cn(
                  'relative z-10 mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                  status === 'completed' && 'bg-green-500',
                  status === 'current' && 'bg-primary animate-pulse',
                  status === 'pending' && 'bg-muted border-2 border-border',
                  status === 'declined' && 'bg-destructive',
                )}>
                  {status === 'completed' && <Check size={12} className="text-white" />}
                  {status === 'current' && <Clock size={12} className="text-primary-foreground" />}
                  {status === 'declined' && <X size={12} className="text-white" />}
                </div>

                {/* Participant card */}
                <div className="flex-1 pb-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn('text-[10px] text-white font-medium', color)}>{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded capitalize">{p.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                  </div>
                  <div className="mt-1 ml-9">
                    {status === 'completed' && p.signedAt && (
                      <p className="text-xs text-green-600">Signed · {formatDate(p.signedAt)}</p>
                    )}
                    {status === 'current' && p.status === 'viewed' && p.viewedAt && (
                      <p className="text-xs text-amber-600">Viewed · {formatDate(p.viewedAt)}</p>
                    )}
                    {status === 'current' && p.status !== 'viewed' && doc.waitingFor && (
                      <p className="text-xs text-primary">Waiting for signature · since {daysSince(doc.waitingFor.since)}d</p>
                    )}
                    {status === 'pending' && (
                      <p className="text-xs text-muted-foreground">Not yet sent</p>
                    )}
                    {status === 'declined' && (
                      <p className="text-xs text-destructive">Declined · Reason: Terms not acceptable</p>
                    )}
                    {(status === 'current' || status === 'pending') && ['sent', 'partially_signed', 'waiting', 'requires_action'].includes(doc.stage) && (
                      <button className="text-[10px] text-primary hover:underline mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Send reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Viewers (simple list below) */}
        {viewers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Viewers</p>
            {viewers.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px] bg-muted">{initials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{p.email}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{completedCount} of {totalAction} {actionLabel}</span>
            <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>
    );
  }

  // Parallel / grouped list (draft, completed, etc.)
  const grouped = {
    signed: allParticipants.filter(p => p.status === 'signed'),
    pending: allParticipants.filter(p => ['pending', 'viewed'].includes(p.status)),
    not_sent: allParticipants.filter(p => p.status === 'not_sent'),
    declined: allParticipants.filter(p => p.status === 'declined'),
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([status, participants]) => {
        if (participants.length === 0) return null;
        const groupLabel = status === 'signed' ? 'Signed' : status === 'pending' ? 'Waiting' : status === 'not_sent' ? 'Pending' : 'Declined';
        return (
          <div key={status}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{groupLabel}</p>
            {participants.map(p => {
              const color = participantColors[p.name] || 'bg-muted-foreground';
              return (
                <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30 group">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={cn('text-[10px] text-white font-medium', color)}>{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {p.status === 'signed' && p.signedAt && (
                      <span className="text-xs text-green-600">Signed · {formatDate(p.signedAt)}</span>
                    )}
                    {p.status === 'not_sent' && (
                      <span className="text-xs text-muted-foreground">Not yet sent</span>
                    )}
                    {p.status === 'declined' && (
                      <span className="text-xs text-destructive">Declined</span>
                    )}
                    {['pending', 'viewed'].includes(p.status) && (
                      <span className="text-xs text-primary">Waiting</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Progress */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            {allParticipants.filter(p => p.status === 'signed').length} of {allParticipants.filter(p => p.role === 'signer').length} signed
          </span>
        </div>
        <Progress value={allParticipants.filter(p => p.role === 'signer').length > 0 ? (allParticipants.filter(p => p.status === 'signed').length / allParticipants.filter(p => p.role === 'signer').length) * 100 : 0} className="h-1.5" />
      </div>
    </div>
  );
}
