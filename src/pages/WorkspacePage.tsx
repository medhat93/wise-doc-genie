import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import PrimarySidebar from '@/components/workspace/PrimarySidebar';
import DocumentSidebar from '@/components/workspace/DocumentSidebar';
import PreviewPanel from '@/components/workspace/PreviewPanel';
import DocumentActionsMenu from '@/components/workspace/DocumentActionsMenu';
import { workspaceDocuments } from '@/data/workspaceDocuments';
import { WorkspaceDocument, SidebarView, QuickLink, DocumentStage } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  Plus, ChevronDown, Search, LayoutGrid, List, MoreVertical,
  Eye, Pencil, Send, Download, FolderInput, Trash2, ChevronLeft, ChevronRight,
  Bell, Check, FileText, Settings, Tag, Share2, Activity, CircleDot, Circle, CheckCircle,
  X, Clock
} from 'lucide-react';

const CURRENT_USER = 'Ahmad Medhat';

const STATUS_FILTER_OPTIONS = [
  { label: 'Draft', stages: ['draft'] as DocumentStage[] },
  { label: 'Approval Cycle', stages: ['approving', 'approved'] as DocumentStage[], children: [
    { label: 'Approving', stages: ['approving'] as DocumentStage[] },
    { label: 'Approved', stages: ['approved'] as DocumentStage[] },
  ]},
  { label: 'In Signing', stages: ['sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'] as DocumentStage[], children: [
    { label: 'Requires your action', stages: ['requires_action'] as DocumentStage[] },
    { label: 'Waiting on others', stages: ['sent', 'partially_signed', 'waiting'] as DocumentStage[] },
    { label: 'Expiring soon', stages: ['expiring'] as DocumentStage[] },
  ]},
  { label: 'Completed', stages: ['completed'] as DocumentStage[] },
  { label: 'Declined', stages: ['declined'] as DocumentStage[] },
  { label: 'Voided', stages: ['voided'] as DocumentStage[] },
  { label: 'Expired', stages: ['expired'] as DocumentStage[] },
];

function getStatusBadge(doc: WorkspaceDocument) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
    approving: { label: 'Approval', className: 'bg-green-100 text-green-700' },
    approved: { label: 'Approval', className: 'bg-green-100 text-green-700' },
    sent: { label: 'Signing', className: 'bg-blue-100 text-blue-700' },
    partially_signed: { label: 'Signing', className: 'bg-blue-100 text-blue-700' },
    waiting: { label: 'Signing', className: 'bg-blue-100 text-blue-700' },
    requires_action: { label: 'Signing', className: 'bg-blue-100 text-blue-700' },
    expiring: { label: 'Expiring', className: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    declined: { label: 'Declined', className: 'bg-red-100 text-red-700' },
    voided: { label: 'Voided', className: 'bg-muted text-muted-foreground' },
    expired: { label: 'Expired', className: 'bg-amber-100 text-amber-700' },
  };
  return map[doc.stage] || map.draft;
}

function getSubStatus(doc: WorkspaceDocument): { text: string; className: string } | null {
  if (doc.stage === 'approving' && doc.workflowStep) {
    return { text: doc.workflowStep, className: 'text-muted-foreground' };
  }
  if (doc.stage === 'requires_action') {
    return { text: 'Action needed', className: 'text-red-600 font-medium' };
  }
  if (['sent', 'partially_signed', 'waiting'].includes(doc.stage)) {
    return { text: 'Waiting on others', className: 'text-muted-foreground' };
  }
  return null;
}

function getActionButton(doc: WorkspaceDocument) {
  const isYourAction = doc.waitingFor?.name === CURRENT_USER;
  if (doc.stage === 'draft') return { label: 'Edit', icon: Pencil, variant: 'outline' as const, className: '' };
  if (doc.stage === 'approving' && isYourAction) return { label: 'Approve', icon: Check, variant: 'default' as const, className: '' };
  if (doc.stage === 'approving') return { label: 'Remind', icon: Bell, variant: 'outline' as const, className: '' };
  if (doc.stage === 'requires_action') return { label: 'Sign', icon: Pencil, variant: 'default' as const, className: '' };
  if (['sent', 'partially_signed', 'waiting'].includes(doc.stage)) return { label: 'Remind', icon: Bell, variant: 'outline' as const, className: '' };
  if (doc.stage === 'completed') return { label: 'View', icon: Eye, variant: 'ghost' as const, className: 'text-muted-foreground' };
  return { label: 'View', icon: Eye, variant: 'ghost' as const, className: 'text-muted-foreground' };
}

function getTagColor(tag: string) {
  const colors: Record<string, string> = {
    'VIP Client': 'bg-blue-100 text-blue-700',
    'Confidential': 'bg-gray-100 text-gray-700',
    'Legal Review': 'bg-purple-100 text-purple-700',
    'Auto-Renewal': 'bg-green-100 text-green-700',
    'Urgent': 'bg-red-100 text-red-700',
  };
  return colors[tag] || 'bg-muted text-muted-foreground';
}

function formatLastActivity(doc: WorkspaceDocument): string {
  if (doc.activities.length === 0) return '—';
  const last = doc.activities[doc.activities.length - 1];
  const diff = Date.now() - new Date(last.timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const date = new Date(last.timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWaitingSince(since: string): string {
  const diff = Date.now() - new Date(since).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `since ${hours}h`;
  return `since ${Math.floor(hours / 24)}d`;
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<SidebarView>('all');
  const [activeQuickLink, setActiveQuickLink] = useState<QuickLink | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<WorkspaceDocument | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [statusFilter, setStatusFilter] = useState<DocumentStage[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Handle query param toasts
  useEffect(() => {
    if (searchParams.get('sent') === 'true') {
      toast.success('Document sent for signature! 🎉', { duration: 4000 });
      searchParams.delete('sent');
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get('signed') === 'true') {
      toast.success('Document signed successfully! ✓', { duration: 4000 });
      searchParams.delete('signed');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const filteredDocs = useMemo(() => {
    let docs = [...workspaceDocuments];
    if (activeView === 'in_progress') docs = docs.filter(d => ['approving', 'sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(d.stage));
    else if (activeView === 'owned') docs = docs.filter(d => d.owner === CURRENT_USER);
    else if (activeView === 'requires_action') docs = docs.filter(d => d.stage === 'requires_action' || d.waitingFor?.name === CURRENT_USER);
    else if (activeView === 'completed') docs = docs.filter(d => d.stage === 'completed');
    else if (activeView === 'expiring') docs = docs.filter(d => d.stage === 'expiring');
    if (statusFilter.length > 0) docs = docs.filter(d => statusFilter.includes(d.stage));
    if (activeTags.length > 0) docs = docs.filter(d => d.tags.some(t => activeTags.includes(t)));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => d.name.toLowerCase().includes(q) || d.counterparty?.toLowerCase().includes(q));
    }
    return docs;
  }, [activeView, statusFilter, activeTags, searchQuery]);

  const totalFake = 250;
  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredDocs.slice(start, start + rowsPerPage);
  }, [filteredDocs, page, rowsPerPage]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === paginatedDocs.length ? new Set() : new Set(paginatedDocs.map(d => d.id)));
  };
  const handleTagToggle = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const toggleStatusFilter = (stages: DocumentStage[]) => {
    setStatusFilter(prev => {
      const allPresent = stages.every(s => prev.includes(s));
      if (allPresent) return prev.filter(s => !stages.includes(s));
      return [...new Set([...prev, ...stages])];
    });
  };

  const isMyAction = (doc: WorkspaceDocument) =>
    doc.stage === 'requires_action' || (doc.waitingFor?.name === CURRENT_USER && doc.stage !== 'draft');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PrimarySidebar />
      <DocumentSidebar
        activeView={activeView}
        activeQuickLink={activeQuickLink}
        onViewChange={setActiveView}
        onQuickLinkChange={setActiveQuickLink}
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
            <span>›</span>
            <span className="text-foreground font-medium">Documents</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[11px] bg-primary text-primary-foreground font-semibold">AM</AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium leading-tight">Ahmad Medhat</p>
                  <p className="text-xs text-muted-foreground leading-tight">ahmed.medhat@signit.sa</p>
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page header */}
        <div className="h-14 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-2xl font-bold">Documents</h1>
          <div className="flex items-center">
            <Button className="gap-1.5 rounded-r-none" onClick={() => navigate('/create')}>
              <Plus size={16} /> New document
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-l-none border-l border-primary-foreground/20 px-2">
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/create')}>Blank Document</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create')}>From Template</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create')}>Upload Document</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-11 flex items-center gap-2 px-6 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 h-9 w-[260px] focus:w-[300px] transition-all duration-200 text-sm rounded-lg"
            />
          </div>

          {/* Filter pills */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
                statusFilter.length > 0
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'
              )}>
                + Status {statusFilter.length > 0 && `(${statusFilter.length})`}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              {STATUS_FILTER_OPTIONS.map(opt => (
                <div key={opt.label}>
                  <button
                    onClick={() => toggleStatusFilter(opt.stages)}
                    className={cn(
                      'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted',
                      opt.stages.every(s => statusFilter.includes(s)) && 'text-primary font-medium'
                    )}
                  >
                    <Checkbox checked={opt.stages.every(s => statusFilter.includes(s))} className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                  {opt.children?.map(child => (
                    <button
                      key={child.label}
                      onClick={() => toggleStatusFilter(child.stages)}
                      className={cn(
                        'flex items-center gap-2 w-full pl-7 pr-2 py-1 text-xs rounded hover:bg-muted',
                        child.stages.every(s => statusFilter.includes(s)) && 'text-primary font-medium'
                      )}
                    >
                      <Checkbox checked={child.stages.every(s => statusFilter.includes(s))} className="h-3 w-3" />
                      {child.label}
                    </button>
                  ))}
                </div>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button onClick={() => setStatusFilter([])} className="w-full text-xs text-primary px-2 py-1.5 hover:bg-muted rounded">Clear filters</button>
                </>
              )}
            </PopoverContent>
          </Popover>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 transition-colors">
            + Sent to
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 transition-colors">
            + Workflow
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 transition-colors">
            + Add filters <ChevronDown size={12} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn('p-1.5 transition-colors', viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn('p-1.5 transition-colors', viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === 'table' ? (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                      <th className="w-10 px-3 py-2">
                        <Checkbox
                          checked={selectedIds.size === paginatedDocs.length && paginatedDocs.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="h-3.5 w-3.5"
                        />
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">Document</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 w-36">Waiting for</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 w-40">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 w-28">Last Activity</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 w-36">Action</th>
                      <th className="w-8 px-2 py-2">
                        <button className="p-1 rounded hover:bg-muted">
                          <Settings size={14} className="text-muted-foreground" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocs.map((doc) => {
                      const statusBadge = getStatusBadge(doc);
                      const subStatus = getSubStatus(doc);
                      const action = getActionButton(doc);
                      const isYou = doc.waitingFor?.name === CURRENT_USER;
                      const myAction = isMyAction(doc);
                      return (
                        <tr
                          key={doc.id}
                          className={cn(
                            'border-b border-border hover:bg-muted/30 cursor-pointer transition-colors',
                            myAction && 'border-l-2 border-l-green-500',
                            previewDoc?.id === doc.id && 'bg-muted/50'
                          )}
                          onClick={() => setPreviewDoc(doc)}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={() => toggleSelect(doc.id)}
                              className="h-3.5 w-3.5"
                            />
                          </td>
                          {/* Document */}
                          <td className="px-2 py-3">
                            <div className="flex items-start gap-2.5">
                              <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{doc.name}</p>
                                {doc.followUpTo && (
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <span className="inline-block">🔗</span> Follow-up to {doc.followUpTo.name}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {doc.tags.slice(0, 2).map(t => (
                                    <span key={t} className={cn('px-1.5 rounded text-[10px] font-medium leading-relaxed', getTagColor(t))}>{t}</span>
                                  ))}
                                  {doc.tags.length > 0 && doc.participants.length > 0 && (
                                    <span className="text-muted-foreground/50 text-xs">·</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {doc.participants.slice(0, 2).map(p => p.name).join(', ')}
                                    {doc.participants.length > 2 && (
                                      <HoverCard openDelay={200} closeDelay={100}>
                                        <HoverCardTrigger asChild>
                                          <span className="cursor-default ml-0.5"> +{doc.participants.length - 2}</span>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-52 p-0" side="bottom" align="start">
                                          <div className="px-3 py-2 border-b border-border">
                                            <p className="text-xs font-semibold text-muted-foreground">Participants ({doc.participants.length})</p>
                                          </div>
                                          {doc.participants.map(p => (
                                            <div key={p.id} className="px-3 py-1.5 text-sm text-foreground">{p.name}</div>
                                          ))}
                                        </HoverCardContent>
                                      </HoverCard>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Waiting for */}
                          <td className="px-2 py-3">
                            {doc.waitingFor ? (
                              <div>
                                <p className={cn('text-sm', isYou ? 'text-primary font-semibold' : 'font-medium')}>
                                  {doc.waitingFor.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatWaitingSince(doc.waitingFor.since)}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Status */}
                          <td className="px-2 py-3">
                            <div>
                              <HoverCard openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <Badge className={cn('text-[10px] font-medium cursor-default', statusBadge.className)}>{statusBadge.label}</Badge>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto min-w-[240px] p-0" side="bottom" align="start">
                                  {doc.approvalSteps ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Approval Progress</p>
                                      </div>
                                      {doc.approvalSteps.map(step => (
                                        <div key={step.name} className="flex items-center justify-between px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            {step.status === 'completed' ? (
                                              <CheckCircle size={14} className="text-green-500" />
                                            ) : (
                                              <Circle size={14} className={cn(step.status === 'in_progress' ? 'text-primary' : 'text-muted-foreground')} />
                                            )}
                                            <span className={cn('text-sm', step.status === 'in_progress' && 'text-primary font-medium')}>{step.name}</span>
                                          </div>
                                          <span className="text-xs text-muted-foreground ml-4">{step.assignee}</span>
                                        </div>
                                      ))}
                                    </>
                                  ) : ['sent', 'partially_signed', 'waiting', 'requires_action'].includes(doc.stage) ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Signing Progress</p>
                                      </div>
                                      {doc.participants.filter(p => p.role === 'signer' || p.role === 'approver').map(p => (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            {p.status === 'signed' ? (
                                              <CheckCircle size={14} className="text-green-500" />
                                            ) : p.status === 'viewed' ? (
                                              <Eye size={14} className="text-amber-500" />
                                            ) : p.status === 'pending' ? (
                                              <Circle size={14} className="text-blue-500" />
                                            ) : (
                                              <Circle size={14} className="text-muted-foreground" />
                                            )}
                                            <span className={cn('text-sm', p.name === CURRENT_USER && 'text-primary font-medium')}>{p.name}</span>
                                          </div>
                                          <span className={cn('text-[11px]', p.status === 'signed' ? 'text-green-600' : p.status === 'viewed' ? 'text-amber-600' : 'text-muted-foreground')}>
                                            {p.status === 'signed' ? 'Signed' : p.status === 'viewed' ? 'Viewed' : p.status === 'pending' ? 'Sent' : 'Not sent'}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  ) : doc.stage === 'completed' ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Completed</p>
                                      </div>
                                      {doc.participants.filter(p => p.role === 'signer').map(p => (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle size={14} className="text-green-500" />
                                            <span className="text-sm">{p.name}</span>
                                          </div>
                                          <span className="text-[11px] text-green-600">Signed</span>
                                        </div>
                                      ))}
                                    </>
                                  ) : doc.stage === 'declined' ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Declined</p>
                                      </div>
                                      {doc.participants.filter(p => p.role === 'signer').map((p, i) => (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            {i === 0 ? <X size={14} className="text-red-500" /> : <Circle size={14} className="text-muted-foreground" />}
                                            <span className="text-sm">{p.name}</span>
                                          </div>
                                          <span className={cn('text-[11px]', i === 0 ? 'text-red-600' : 'text-muted-foreground')}>
                                            {i === 0 ? 'Declined' : 'Cancelled'}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  ) : doc.stage === 'voided' ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Voided</p>
                                      </div>
                                      <div className="px-3 py-2 text-sm text-muted-foreground">
                                        Document was voided by {doc.owner}
                                      </div>
                                    </>
                                  ) : doc.stage === 'expired' ? (
                                    <>
                                      <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">Expired</p>
                                      </div>
                                      {doc.participants.filter(p => p.role === 'signer').map(p => (
                                        <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                                          <div className="flex items-center gap-2">
                                            {p.status === 'signed' ? (
                                              <CheckCircle size={14} className="text-green-500" />
                                            ) : (
                                              <Clock size={14} className="text-amber-500" />
                                            )}
                                            <span className="text-sm">{p.name}</span>
                                          </div>
                                          <span className={cn('text-[11px]', p.status === 'signed' ? 'text-green-600' : 'text-amber-600')}>
                                            {p.status === 'signed' ? 'Signed' : 'Expired'}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                      {statusBadge.label}
                                    </div>
                                  )}
                                </HoverCardContent>
                              </HoverCard>
                              {subStatus && (
                                <p className={cn('text-[10px] mt-0.5 truncate max-w-[120px]', subStatus.className)}>{subStatus.text}</p>
                              )}
                            </div>
                          </td>
                          {/* Last Activity */}
                          <td className="px-2 py-3">
                            <span className="text-sm text-muted-foreground">{formatLastActivity(doc)}</span>
                          </td>
                          {/* Action */}
                          <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant={action.variant}
                                className={cn('h-7 text-xs gap-1.5 w-[100px] font-medium', action.className)}
                                onClick={() => {
                                  if (action.label === 'Sign') navigate(`/signing/${doc.id}`);
                                }}
                              >
                                <action.icon size={14} /> {action.label}
                              </Button>
                              <DocumentActionsMenu doc={doc} />
                            </div>
                          </td>
                          <td />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="h-12 border-t border-border flex items-center justify-between px-6 text-sm shrink-0">
                <span className="text-xs text-muted-foreground">
                  Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalFake)} of {totalFake}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft size={14} />
                    </Button>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Button
                        key={n}
                        variant={page === n ? 'default' : 'outline'}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </Button>
                    ))}
                    <span className="text-muted-foreground px-1">...</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= 10} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <span>Rows per page</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                          {rowsPerPage} <ChevronDown size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[10, 25, 50, 100].map(n => (
                          <DropdownMenuItem key={n} onClick={() => { setRowsPerPage(n); setPage(1); }}>{n}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LayoutGrid size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground">Board View</h3>
                <p className="text-sm text-muted-foreground/60">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel (Sheet) */}
      <PreviewPanel document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
