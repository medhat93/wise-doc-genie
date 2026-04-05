import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  X, Send, Download, Pencil, MoreHorizontal, Clock, FileText, Eye,
  PenTool, Bell, XCircle, Plus, CheckCircle, Circle, GitPullRequest,
  Users, File, AlertTriangle, Ban, Lock, Copy, Check, Link as LinkIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import DocumentActionsMenu from './DocumentActionsMenu';
import FollowUpDialog from './FollowUpDialog';

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

const participantStatusConfig: Record<string, { label: string; className: string }> = {
  signed:   { label: 'Signed',       className: 'bg-green-50 text-green-600' },
  viewed:   { label: 'Viewed',       className: 'bg-amber-50 text-amber-600' },
  pending:  { label: 'Pending',      className: 'bg-muted text-muted-foreground' },
  declined: { label: 'Declined',     className: 'bg-destructive/10 text-destructive' },
  not_sent: { label: 'Not yet sent', className: 'bg-muted text-muted-foreground/50' },
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

/* ── MOCK EXTENDED ACTIVITIES ─────────────────────────────────── */
function getMockActivities(doc: WorkspaceDocument) {
  const base = [...doc.activities];
  // Add a few more mock entries for richness
  const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };
  if (base.length < 4) {
    base.unshift(
      { id: 'mx1', type: 'created' as const, actor: doc.owner, timestamp: daysAgo(28), description: 'Document created from template' },
      { id: 'mx2', type: 'viewed' as const, actor: doc.owner, timestamp: daysAgo(25), description: `${doc.owner} viewed the document` },
      { id: 'mx3', type: 'commented' as const, actor: doc.owner, timestamp: daysAgo(20), description: 'Added a comment on section 3.1' },
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
  acknowledgment?: { participant: string; requirement: string };
}

function getMockSubDocuments(_doc: WorkspaceDocument): SubDocument[] {
  return [
    { id: 'd1', name: 'Master Services Agreement', type: 'Primary', pages: 8, visibleTo: 'all' },
    { id: 'd2', name: 'Schedule A — Pricing & Fee Structure', type: 'Supplement', pages: 3, visibleTo: ['Ahmad Medhat', 'Sarah Johnson'], acknowledgment: { participant: 'Sarah Johnson', requirement: 'Must view and accept before signing' } },
    { id: 'd3', name: 'Confidential Financial Terms', type: 'Supplement', pages: 2, visibleTo: ['Ahmad Medhat'], acknowledgment: { participant: 'Ahmad Medhat', requirement: 'Must view before signing' } },
    { id: 'd4', name: 'Insurance Certificate', type: 'Attachment', pages: 1, visibleTo: 'all' },
  ];
}

/* ── MOCK PARTICIPANT VISIBILITY ──────────────────────────────── */
const participantVisibility: Record<string, string[] | 'all'> = {
  'Ahmad Medhat': 'all',
  'Sarah Johnson': ['Master Services Agreement', 'Schedule A — Pricing & Fee Structure', 'Insurance Certificate'],
  'Mike Torres': ['Master Services Agreement', 'Insurance Certificate'],
};

const participantColors: Record<string, string> = {
  'Ahmad Medhat': 'bg-blue-500',
  'Sarah Johnson': 'bg-rose-500',
  'Mike Torres': 'bg-amber-500',
};

/* ── PROPERTIES SECTION ───────────────────────────────────────── */
function PropertiesSection() {
  const [editing, setEditing] = useState(false);
  const [contractType, setContractType] = useState('Service Agreement');
  const [department, setDepartment] = useState('Legal');
  const [priority, setPriority] = useState('Medium');

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</p>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Contract Type</label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
                <SelectItem value="Employment">Employment</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => { setEditing(false); toast.success('Properties updated'); }}>Save</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</p>
        <button className="text-xs text-primary hover:underline" onClick={() => setEditing(true)}>Edit</button>
      </div>
      <div className="mt-2 space-y-1.5">
        {[
          ['Contract Type', contractType],
          ['Department', department],
          ['Priority', priority],
        ].map(([label, value]) => (
          <div key={label as string} className="flex justify-between items-center py-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium border-b border-dashed border-transparent hover:border-muted-foreground/30 cursor-pointer">{value}</span>
          </div>
        ))}
      </div>
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
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const signers = doc.participants.filter(p => p.role === 'signer');
  const approvers = doc.participants.filter(p => p.role === 'approver');
  const viewers = doc.participants.filter(p => p.role === 'viewer');

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

  /* contextual visible buttons */
  function renderActionButtons() {
    const moreMenu = (
      <DocumentActionsMenu
        doc={doc}
        onRename={handleRename}
        onParticipants={() => setActiveTab('participants')}
        trigger={<Button variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal size={14} /></Button>}
      />
    );

    if (doc.stage === 'draft') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => navigate('/editor')}><Pencil size={12} /> Edit</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.info('Opening send flow...')}><Send size={12} /> Send</Button>
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
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success(`Reminder sent to ${doc.participants.filter(p => p.status === 'pending').length} pending participants`)}><Bell size={12} /> Remind</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          {moreMenu}
        </>
      );
    }
    if (isSigning && isYourAction) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => navigate(`/signing/${doc.id}`)}><PenTool size={12} /> Sign</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          {moreMenu}
        </>
      );
    }
    if (isSigning) {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success(`Reminder sent to ${doc.participants.filter(p => p.status === 'pending').length} pending participants`)}><Bell size={12} /> Remind</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'completed') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => setFollowUpOpen(true)}><LinkIcon size={12} /> Add follow-up</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Moved to vault')}><Lock size={12} /> Move to vault</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'declined' || doc.stage === 'voided') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Document duplicated')}><Copy size={12} /> Duplicate</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          {moreMenu}
        </>
      );
    }
    if (doc.stage === 'expired') {
      return (
        <>
          <Button className="h-7 text-xs gap-1" onClick={() => toast.success('Document resent with new expiration')}><Send size={12} /> Resend</Button>
          <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
          {moreMenu}
        </>
      );
    }
    // fallback
    return (
      <>
        <Button variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success('Download started')}><Download size={12} /> Download</Button>
        {moreMenu}
      </>
    );
  }

  return (
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
              {/* Documents section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</p>
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
                        <div className="ml-7 mt-1 space-y-0.5">
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
                          {sd.acknowledgment && (
                            <p className="text-[10px] text-amber-600 ml-[14px]">· {sd.acknowledgment.participant === (sd.visibleTo as string[]).find(n => n === sd.acknowledgment!.participant) ? sd.acknowledgment.participant.split(' ')[0] : sd.acknowledgment.participant} {sd.acknowledgment.requirement.toLowerCase().replace('must ', 'must ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Key Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Details</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {([
                    ['Type', doc.category],
                    ['Counterparty', doc.counterparty || '—'],
                    ['Sender', doc.owner],
                    ['Created', formatDate(doc.createdAt)],
                    ['Last modified', formatDate(doc.modifiedAt)],
                    ['Expiry date', doc.expiresAt ? formatDate(doc.expiresAt) : '—'],
                    ['Folder', doc.folder || '—'],
                    ['Value', doc.value || '—'],
                  ] as const).map(([label, value]) => (
                    <React.Fragment key={label}>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium truncate text-foreground">{value}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Properties */}
              <PropertiesSection />

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

              <Separator />

              {/* Signing Order / Approval Chain / Signers */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {['approving', 'approved'].includes(doc.stage) ? 'Approval Chain' :
                   ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(doc.stage) ? 'Signing Order' : 'Signers'}
                </p>

                {/* Approval chain */}
                {['approving', 'approved'].includes(doc.stage) && doc.approvalSteps ? (
                  <div>
                    {doc.approvalSteps.map((step) => {
                      const isCurrent = step.status === 'in_progress';
                      return (
                        <div key={step.name} className={cn(
                          'flex items-center justify-between py-2 border-b border-border/30',
                          isCurrent && 'bg-primary/5 rounded-md px-3 -mx-3'
                        )}>
                          <div className="flex items-center gap-2">
                            {step.status === 'completed' ? (
                              <CheckCircle size={14} className="text-green-500" />
                            ) : step.status === 'in_progress' ? (
                              <Clock size={14} className="text-primary" />
                            ) : (
                              <Circle size={14} className="text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{step.name}</p>
                              <p className="text-xs text-muted-foreground">{step.assignee}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {step.status === 'completed' ? 'Approved' : step.status === 'in_progress' ? 'Waiting...' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground mt-2">
                      {doc.approvalSteps.filter(s => s.status === 'completed').length} of {doc.approvalSteps.length} approved
                    </p>
                  </div>
                ) : (
                  /* Signing list */
                  <div>
                    {doc.participants.filter(p => p.role === 'signer').map(p => {
                      const sc = participantStatusConfig[p.status] || participantStatusConfig.pending;
                      return (
                        <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 font-medium">{initials(p.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                          <span className={cn('text-xs', sc.className === 'bg-green-50 text-green-600' ? 'text-green-600' : sc.className.includes('destructive') ? 'text-destructive' : sc.className.includes('amber') ? 'text-amber-600' : 'text-muted-foreground')}>
                            {sc.label}
                          </span>
                        </div>
                      );
                    })}
                    {['sent', 'partially_signed', 'waiting', 'requires_action'].includes(doc.stage) && (
                      <button className="text-xs text-primary hover:underline mt-2">Send reminder</button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ═══ TAB 2: ACTIVITY ═══ */}
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
              <button className="text-xs text-primary hover:underline mt-3">View full audit trail</button>
            </TabsContent>

            {/* ═══ TAB 3: PARTICIPANTS ═══ */}
            <TabsContent value="participants" className="p-4 mt-0 space-y-4">
              {signers.length > 0 && (
                <ParticipantGroup label="Signers" participants={signers} stage={doc.stage} hasVisibilityDifferences />
              )}
              {approvers.length > 0 && (
                <ParticipantGroup label="Approvers" participants={approvers} stage={doc.stage} hasVisibilityDifferences />
              )}
              {viewers.length > 0 && (
                <ParticipantGroup label="Viewers" participants={viewers} stage={doc.stage} hasVisibilityDifferences />
              )}
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                {doc.participants.length} participants: {signers.length > 0 ? `${signers.length} signer${signers.length > 1 ? 's' : ''}` : ''}
                {approvers.length > 0 ? `, ${approvers.length} approver${approvers.length > 1 ? 's' : ''}` : ''}
                {viewers.length > 0 ? `, ${viewers.length} viewer${viewers.length > 1 ? 's' : ''}` : ''}
              </p>
            </TabsContent>


            {/* ═══ TAB 5: WORKFLOW ═══ */}
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
  );
}

/* ── PARTICIPANT GROUP SUB-COMPONENT ──────────────────────────── */
function ParticipantGroup({ label, participants, stage, hasVisibilityDifferences }: {
  label: string;
  participants: WorkspaceDocument['participants'];
  stage: string;
  hasVisibilityDifferences?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {participants.map(p => {
        const sc = participantStatusConfig[p.status] || participantStatusConfig.pending;
        const visibility = participantVisibility[p.name];
        const showVisibility = hasVisibilityDifferences && visibility;
        return (
          <div key={p.id} className="group flex items-start gap-3 py-3 border-b border-border/30">
            <Avatar className="h-8 w-8 mt-0.5">
              <AvatarFallback className="text-xs bg-primary/10">{initials(p.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded capitalize">{p.role}</span>
              </div>
              {showVisibility && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Can see: {visibility === 'all' ? 'All documents' : (visibility as string[]).join(', ')}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className={cn('text-[10px] px-2 h-5 inline-flex items-center rounded-full font-medium', sc.className)}>{sc.label}</span>
              {p.status === 'signed' && p.signedAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(p.signedAt)}</p>
              )}
              {['pending', 'viewed'].includes(p.status) && ['sent', 'partially_signed', 'waiting', 'requires_action'].includes(stage) && (
                <button className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 hover:underline">
                  Send reminder
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
