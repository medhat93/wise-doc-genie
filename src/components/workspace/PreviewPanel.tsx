import React, { useState } from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { X, Send, Download, Pencil, MoreHorizontal, Clock, User, FileText, Eye, PenTool, Bell, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const stageLabels: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  approving: { label: 'Approving', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
  partially_signed: { label: 'Partially Signed', className: 'bg-blue-100 text-blue-700' },
  waiting: { label: 'Waiting', className: 'bg-amber-100 text-amber-700' },
  requires_action: { label: 'Action Required', className: 'bg-red-100 text-red-700' },
  expiring: { label: 'Expiring Soon', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-700' },
  voided: { label: 'Voided', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

const activityIcons: Record<string, React.ElementType> = {
  created: FileText,
  sent: Send,
  viewed: Eye,
  signed: PenTool,
  declined: XCircle,
  reminder: Bell,
  approved: User,
  voided: XCircle,
  expired: Clock,
  commented: FileText,
};

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  document: WorkspaceDocument;
  onClose: () => void;
}

export default function PreviewPanel({ document: doc, onClose }: Props) {
  const stage = stageLabels[doc.stage] ?? stageLabels.draft;

  return (
    <div className="w-[400px] h-full border-l border-border bg-background flex flex-col shrink-0 animate-slide-in-right">
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
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', stage.className)}>{stage.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5"><Send size={14} /> Send</Button>
          <Button size="sm" variant="outline" className="gap-1.5"><Download size={14} /> Download</Button>
          <Button size="sm" variant="outline" className="gap-1.5"><Pencil size={14} /> Edit</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
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
            {/* Preview placeholder */}
            <div className="h-32 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground text-sm">
              <FileText size={24} className="mr-2 opacity-50" /> Document Preview
            </div>
            {/* Details */}
            <div className="space-y-2 text-sm">
              {[
                ['Type', doc.category],
                ['Counterparty', doc.counterparty || '—'],
                ['Owner', doc.owner],
                ['Created', new Date(doc.createdAt).toLocaleDateString()],
                ['Modified', formatRelative(doc.modifiedAt)],
                ...(doc.expiresAt ? [['Expires', new Date(doc.expiresAt).toLocaleDateString()]] : []),
                ...(doc.folder ? [['Folder', doc.folder]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            {doc.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            {/* Participants summary */}
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Participants</p>
              <div className="space-y-2">
                {doc.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    <Badge variant="outline" className={cn('text-[10px]',
                      p.status === 'signed' && 'border-green-300 text-green-700',
                      p.status === 'declined' && 'border-red-300 text-red-700',
                      p.status === 'viewed' && 'border-blue-300 text-blue-700',
                    )}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
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
              {doc.participants.map((p) => (
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
                    <p className={cn('text-[10px] mt-0.5',
                      p.status === 'signed' && 'text-green-600',
                      p.status === 'declined' && 'text-red-600',
                      p.status === 'pending' && 'text-muted-foreground',
                    )}>
                      {p.status === 'signed' && p.signedAt ? `Signed ${formatRelative(p.signedAt)}` : p.status}
                    </p>
                  </div>
                </div>
              ))}
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
