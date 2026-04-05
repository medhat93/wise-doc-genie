import React from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { X, Send, Download, Pencil, MoreHorizontal, Clock, User, FileText, Eye, PenTool, Bell, XCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet';

const stageConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  approving: { label: 'Approval', className: 'bg-green-100 text-green-700' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
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

const activityIcons: Record<string, React.ElementType> = {
  created: FileText, sent: Send, viewed: Eye, signed: PenTool,
  declined: XCircle, reminder: Bell, approved: User, voided: XCircle,
  expired: Clock, commented: FileText,
};

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const participantStatusConfig: Record<string, { label: string; className: string }> = {
  signed: { label: 'Signed', className: 'text-green-600' },
  pending: { label: 'Pending', className: 'text-muted-foreground' },
  viewed: { label: 'Viewed', className: 'text-amber-600' },
  declined: { label: 'Declined', className: 'text-red-600' },
  not_sent: { label: 'Not yet sent', className: 'text-muted-foreground' },
};

interface Props {
  document: WorkspaceDocument | null;
  onClose: () => void;
}

export default function PreviewPanel({ document: doc, onClose }: Props) {
  if (!doc) return null;
  const stage = stageConfig[doc.stage] ?? stageConfig.draft;

  return (
    <Sheet open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[400px] p-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-2 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{doc.name}</h3>
              {doc.counterparty && <p className="text-sm text-muted-foreground">{doc.counterparty}</p>}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1 h-7 w-7" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <Badge className={cn('text-[11px] rounded-full px-2 h-6', stage.className)}>{stage.label}</Badge>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" className="h-7 text-xs gap-1"><Send size={12} /> Send</Button>
            <Button variant="outline" className="h-7 text-xs gap-1"><Download size={12} /> Download</Button>
            <Button variant="outline" className="h-7 text-xs gap-1"><Pencil size={12} /> Edit</Button>
            <Button variant="outline" className="h-7 w-7 p-0"><MoreHorizontal size={14} /></Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 border-b border-border shrink-0">
            <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-4">
              <TabsTrigger value="overview" className="text-xs rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Activity</TabsTrigger>
              <TabsTrigger value="participants" className="text-xs rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Participants</TabsTrigger>
              {doc.approvalSteps && (
                <TabsTrigger value="approval" className="text-xs rounded-none pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Approval</TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="p-4 space-y-4 mt-0">
              {/* Preview placeholder */}
              <div className="h-24 rounded-lg bg-muted/30 border border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors">
                <FileText size={32} className="text-muted-foreground/50" />
                <span className="text-xs text-primary">Click to open full document</span>
              </div>

              {/* Key Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Key Details</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    ['Type', doc.category],
                    ['Counterparty', doc.counterparty || '—'],
                    ['Sender', doc.owner],
                    ['Created', new Date(doc.createdAt).toLocaleDateString('en-CA')],
                    ['Last modified', new Date(doc.modifiedAt).toLocaleDateString('en-CA')],
                    ['Expiry date', doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString('en-CA') : '—'],
                    ['Folder', doc.folder || '—'],
                    ['Value', doc.value || '—'],
                  ].map(([label, value]) => (
                    <React.Fragment key={label as string}>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium truncate">{value}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((t) => (
                    <span key={t} className="bg-muted border border-border text-xs px-2 py-0.5 rounded-md">{t}</span>
                  ))}
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={10} /> Add
                  </button>
                </div>
              </div>

              {/* Signing Order */}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signing Order</p>
                <div>
                  {doc.participants.map((p) => {
                    const statusCfg = participantStatusConfig[p.status] || participantStatusConfig.pending;
                    return (
                      <div key={p.id} className="flex items-center gap-2 py-2 border-b border-border/30">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 font-medium">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                        <span className={cn('text-xs', statusCfg.className)}>{statusCfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="p-4 mt-0">
              <div className="relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                {doc.activities.slice().reverse().map((evt) => {
                  const Icon = activityIcons[evt.type] || FileText;
                  return (
                    <div key={evt.id} className="relative pl-7 py-2">
                      <div className="absolute left-0 top-3 w-5 h-5 rounded-full bg-card border-2 border-border flex items-center justify-center">
                        <Icon size={10} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm">{evt.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{evt.actor} · {formatRelative(evt.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="participants" className="p-4 mt-0">
              <div className="space-y-3">
                {doc.participants.map((p) => {
                  const statusCfg = participantStatusConfig[p.status] || participantStatusConfig.pending;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px] capitalize">{p.role}</Badge>
                        <p className={cn('text-[10px] mt-0.5', statusCfg.className)}>
                          {p.status === 'signed' && p.signedAt ? `Signed ${formatRelative(p.signedAt)}` : statusCfg.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {doc.approvalSteps && (
              <TabsContent value="approval" className="p-4 mt-0">
                <div className="space-y-0">
                  {doc.approvalSteps.map((step, i) => (
                    <div key={step.name} className="flex gap-3 pb-4 relative">
                      {i < doc.approvalSteps!.length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
                      )}
                      <div className={cn(
                        'relative z-10 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                        step.status === 'completed' && 'bg-green-500',
                        step.status === 'in_progress' && 'bg-primary',
                        step.status === 'pending' && 'bg-muted border border-border',
                      )}>
                        {step.status === 'completed' ? (
                          <PenTool size={10} className="text-white" />
                        ) : step.status === 'in_progress' ? (
                          <Clock size={10} className="text-primary-foreground" />
                        ) : (
                          <Clock size={10} className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.assignee} · {step.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
