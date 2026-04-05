import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimarySidebar from '@/components/workspace/PrimarySidebar';
import DocumentSidebar from '@/components/workspace/DocumentSidebar';
import PreviewPanel from '@/components/workspace/PreviewPanel';
import StageTracker from '@/components/workspace/StageTracker';
import BoardView from '@/components/workspace/BoardView';
import BulkActionBar from '@/components/workspace/BulkActionBar';
import { workspaceDocuments } from '@/data/workspaceDocuments';
import { WorkspaceDocument, SidebarView, QuickLink, DocumentStage } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  Plus, ChevronDown, Search, LayoutGrid, List, Star, MoreHorizontal,
  Eye, Pencil, Send, Download, FolderInput, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const stageLabels: Record<string, string> = {
  draft: 'Draft', approving: 'Approving', approved: 'Approved', sent: 'Sent',
  partially_signed: 'Partially Signed', waiting: 'Waiting', requires_action: 'Action Required',
  expiring: 'Expiring', completed: 'Completed', declined: 'Declined', voided: 'Voided', expired: 'Expired',
};

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

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatWaitingSince(since: string): string {
  const diff = Date.now() - new Date(since).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `since ${hours}h`;
  return `since ${Math.floor(hours / 24)}d`;
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<SidebarView>('all');
  const [activeQuickLink, setActiveQuickLink] = useState<QuickLink | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<WorkspaceDocument | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [statusFilter, setStatusFilter] = useState<DocumentStage[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    new Set(workspaceDocuments.filter(d => d.isFavorite).map(d => d.id))
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // View counts
  const viewCounts = useMemo(() => {
    const counts: Record<SidebarView, number> = {
      all: workspaceDocuments.length,
      in_progress: workspaceDocuments.filter(d => ['approving', 'sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(d.stage)).length,
      owned: workspaceDocuments.filter(d => d.owner === 'Ahmed Medhat').length,
      requires_action: workspaceDocuments.filter(d => d.stage === 'requires_action').length,
      assigned: workspaceDocuments.filter(d => d.participants.some(p => p.email === 'ahmed@company.com' && p.status === 'pending')).length,
      received: 3,
      expiring: workspaceDocuments.filter(d => d.stage === 'expiring').length,
      completed: workspaceDocuments.filter(d => d.stage === 'completed').length,
      shared: 4,
    };
    return counts;
  }, []);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let docs = [...workspaceDocuments];

    // View filter
    if (activeView === 'in_progress') docs = docs.filter(d => ['approving', 'sent', 'partially_signed', 'waiting', 'requires_action', 'expiring'].includes(d.stage));
    else if (activeView === 'owned') docs = docs.filter(d => d.owner === 'Ahmed Medhat');
    else if (activeView === 'requires_action') docs = docs.filter(d => d.stage === 'requires_action');
    else if (activeView === 'assigned') docs = docs.filter(d => d.participants.some(p => p.email === 'ahmed@company.com' && p.status === 'pending'));
    else if (activeView === 'expiring') docs = docs.filter(d => d.stage === 'expiring');
    else if (activeView === 'completed') docs = docs.filter(d => d.stage === 'completed');

    // Status filter
    if (statusFilter.length > 0) docs = docs.filter(d => statusFilter.includes(d.stage));

    // Tag filter
    if (activeTags.length > 0) docs = docs.filter(d => d.tags.some(t => activeTags.includes(t)));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.counterparty?.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }

    return docs;
  }, [activeView, statusFilter, activeTags, searchQuery]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredDocs.slice(start, start + rowsPerPage);
  }, [filteredDocs, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredDocs.length / rowsPerPage);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDocs.map(d => d.id)));
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  const viewLabel = activeView !== 'all'
    ? { in_progress: 'In progress', owned: 'Owned by me', requires_action: 'Requires your action', assigned: 'Assigned to me', received: 'Received', expiring: 'Expiring soon', completed: 'Completed', shared: 'Shared with me' }[activeView]
    : null;

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
        viewCounts={viewCounts}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Context bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="#">Documents</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Workspace</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            {viewLabel && (
              <Badge variant="secondary" className="gap-1.5">
                {viewLabel}
                <button onClick={() => setActiveView('all')} className="hover:opacity-70"><X size={12} /></button>
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">AM</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Ahmed Medhat</p>
                  <p className="text-xs text-muted-foreground">ahmed@company.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page header */}
        <div className="h-14 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-2xl font-bold">Documents</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5">
                <Plus size={16} /> New document <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>Blank Document</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/')}>From Template</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/')}>Upload Document</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toolbar */}
        <div className="h-11 flex items-center gap-3 px-6 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 h-8 w-[260px] focus:w-[300px] transition-all text-sm"
            />
          </div>

          {/* Status filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-8 text-xs gap-1.5 border-dashed', statusFilter.length > 0 && 'border-primary text-primary')}>
                Status {statusFilter.length > 0 && `(${statusFilter.length})`}
              </Button>
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
                    <Checkbox
                      checked={opt.stages.every(s => statusFilter.includes(s))}
                      className="h-3.5 w-3.5"
                    />
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
                      <Checkbox
                        checked={child.stages.every(s => statusFilter.includes(s))}
                        className="h-3 w-3"
                      />
                      {child.label}
                    </button>
                  ))}
                </div>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button onClick={() => setStatusFilter([])} className="w-full text-xs text-primary px-2 py-1.5 hover:bg-muted rounded">
                    Clear filters
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          {/* View toggle */}
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
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            {viewMode === 'table' ? (
              <>
                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border">
                        <th className="w-10 px-3 py-2">
                          <Checkbox
                            checked={selectedIds.size === paginatedDocs.length && paginatedDocs.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="h-3.5 w-3.5"
                          />
                        </th>
                        <th className="w-8" />
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Document</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2 w-24">Type</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2 w-32">Stage</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2 w-32">Waiting For</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2 w-40">Last Activity</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className={cn('border-b border-border hover:bg-muted/30 cursor-pointer transition-colors', previewDoc?.id === doc.id && 'bg-muted/50')}
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={() => toggleSelect(doc.id)}
                              className="h-3.5 w-3.5"
                            />
                          </td>
                          <td className="py-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleFavorite(doc.id)} className="hover:scale-110 transition-transform">
                              <Star size={14} className={cn(favorites.has(doc.id) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
                            </button>
                          </td>
                          <td className="px-2 py-3">
                            <div>
                              <p className="font-medium truncate max-w-[280px]">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {doc.tags.slice(0, 2).map(t => (
                                  <Badge key={t} variant="outline" className="text-[9px] h-4 px-1">{t}</Badge>
                                ))}
                                <div className="flex -space-x-1.5 ml-1">
                                  {doc.participants.slice(0, 3).map(p => (
                                    <Avatar key={p.id} className="h-4 w-4 border border-background">
                                      <AvatarFallback className="text-[7px]">{p.name[0]}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {doc.participants.length > 3 && (
                                    <span className="text-[9px] text-muted-foreground ml-1">+{doc.participants.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                          </td>
                          <td className="px-2 py-3">
                            <StageTracker doc={doc} />
                          </td>
                          <td className="px-2 py-3">
                            {doc.waitingFor ? (
                              <div>
                                <p className={cn('text-xs font-medium', doc.waitingFor.name === 'You' && 'text-green-600')}>
                                  {doc.waitingFor.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatWaitingSince(doc.waitingFor.since)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            {doc.activities.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {doc.activities[doc.activities.length - 1].actor} {doc.activities[doc.activities.length - 1].type}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatRelative(doc.activities[doc.activities.length - 1].timestamp)}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded hover:bg-muted"><MoreHorizontal size={14} /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye size={13} className="mr-2" /> View</DropdownMenuItem>
                                <DropdownMenuItem><Pencil size={13} className="mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem><Send size={13} className="mr-2" /> Send</DropdownMenuItem>
                                <DropdownMenuItem><Download size={13} className="mr-2" /> Download</DropdownMenuItem>
                                <DropdownMenuItem><FolderInput size={13} className="mr-2" /> Move</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive"><Trash2 size={13} className="mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="h-12 border-t border-border flex items-center justify-between px-6 text-sm shrink-0">
                  <span className="text-muted-foreground">
                    Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredDocs.length)} of {filteredDocs.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          {rowsPerPage} rows <ChevronDown size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[10, 25, 50].map(n => (
                          <DropdownMenuItem key={n} onClick={() => { setRowsPerPage(n); setPage(1); }}>{n}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft size={14} />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i}
                          variant={page === i + 1 ? 'default' : 'outline'}
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <BoardView documents={filteredDocs} onDocumentClick={setPreviewDoc} />
            )}
          </div>

          {/* Preview Panel */}
          {previewDoc && (
            <PreviewPanel document={previewDoc} onClose={() => setPreviewDoc(null)} />
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar count={selectedIds.size} onDeselect={() => setSelectedIds(new Set())} />
    </div>
  );
}
