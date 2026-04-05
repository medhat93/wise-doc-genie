import React from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { X, Send, Download, Pencil, MoreHorizontal, Clock, User, FileText, Eye, PenTool, Bell, XCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  document: WorkspaceDocument;
  onClose: () => void;
}

export default function PreviewPanel({ document: doc, onClose }: Props) {
  const stage = stageConfig[doc.stage] ?? stageConfig.draft;

  return (
    <div className="w-[380px] h-full border-l border-border bg-background flex flex-col shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{doc.name}</h3>
            {doc.counterparty && <p className="text-sm text-muted-foreground">{doc.counterparty}</p>}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <Badge className={cn('text-xs', stage.className)}>{stage.label}</Badge>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Send size={13} /> Send</Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Download size={13} /> Download</Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Pencil size={13} /> Edit</Button>
          <Button size="icon" variant="outline" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-border h-10 px-4 bg-transparent shrink-0">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          <TabsTrigger value="participants" className="text-xs">Participants</TabsTrigger>
          {doc.approvalSteps && <TabsTrigger value="approval" className="text-xs">Approval</TabsTrigger>}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overview" className="p-4 space-y-4 mt-0">
            {/* Document preview placeholder */}
            <div className="h-28 rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center text-muted-foreground gap-1 cursor-pointer hover:bg-muted/70 transition-colors">
              <FileText size={24} className="opacity-50" />
              <span className="text-xs">Click to open full document</span>
            </div>

            {/* Key Details */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Details</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
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
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
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
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
                <button className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                  <Plus size={10} /> Add
                </button>
              </div>
            </div>

            {/* Signing Order */}
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signing Order</p>
              <div className="space-y-2">
                {doc.participants.map((p) => {
                  const statusCfg = participantStatusConfig[p.status] || participantStatusConfig.pending;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-muted">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                      </div>
                      <span className={cn('text-xs font-medium', statusCfg.className)}>{statusCfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4 mt-0">
            <div className="relative space-y-0">
              {doc.activities.slice().reverse().map((evt, i) => {
                const Icon = activityIcons[evt.type] || FileText;
                return (
                  <div key={evt.id} className="flex gap-3 pb-4 relative">
                    {i < doc.activities.length - 1 && (
                      <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
                    )}
                    <div className="relative z-10 mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">{evt.description}</p>
                      <p className="text-xs text-muted-foreground">{evt.actor} · {formatRelative(evt.timestamp)}</p>
                    </div>
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
    </div>
  );
}
