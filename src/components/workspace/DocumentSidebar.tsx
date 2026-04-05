import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FileText, Users, Send, Trash2, ChevronDown, FolderClosed, MoreHorizontal, Plus
} from 'lucide-react';
import { SidebarView, QuickLink } from '@/types/workspace';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Props {
  activeView: SidebarView;
  activeQuickLink: QuickLink | null;
  onViewChange: (view: SidebarView) => void;
  onQuickLinkChange: (link: QuickLink | null) => void;
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  viewCounts: Record<SidebarView, number>;
}

const QUICK_LINKS: { id: QuickLink; label: string; icon: React.ElementType }[] = [
  { id: 'my_documents', label: 'My Documents', icon: FileText },
  { id: 'shared_with_me', label: 'Shared with me', icon: Users },
  { id: 'bulk_send', label: 'Bulk Send', icon: Send },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const VIEWS: { id: SidebarView; label: string; dot?: string; pulse?: boolean }[] = [
  { id: 'in_progress', label: 'In progress', dot: 'bg-blue-500' },
  { id: 'owned', label: 'Owned by me' },
  { id: 'requires_action', label: 'Requires your action', dot: 'bg-amber-500', pulse: true },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'received', label: 'Received' },
  { id: 'expiring', label: 'Expiring soon', dot: 'bg-red-500' },
  { id: 'completed', label: 'Completed', dot: 'bg-green-500' },
  { id: 'shared', label: 'Shared with me' },
];

const FOLDERS = ['Contracts', 'HR Onboarding', 'Procurement', 'NDAs'];
const TAGS = ['arbitration', 'assignment', 'urgent', 'NDA', 'renewal', 'VIP client'];

export default function DocumentSidebar({
  activeView, activeQuickLink, onViewChange, onQuickLinkChange,
  activeTags, onTagToggle, viewCounts
}: Props) {
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  return (
    <div className="w-[240px] h-full border-r border-border bg-background overflow-y-auto shrink-0">
      <div className="p-3 space-y-5">
        {/* Quick Links */}
        <div>
          <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Links</p>
          <div className="space-y-0.5">
            {QUICK_LINKS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onQuickLinkChange(activeQuickLink === id ? null : id);
                  onViewChange('all');
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                  activeQuickLink === id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Views */}
        <div>
          <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Views</p>
          <div className="space-y-0.5">
            {VIEWS.map(({ id, label, dot, pulse }) => (
              <button
                key={id}
                onClick={() => {
                  onViewChange(activeView === id ? 'all' : id);
                  onQuickLinkChange(null);
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors group',
                  activeView === id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                )}
              >
                {dot && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    {pulse && <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', dot)} />}
                    <span className={cn('relative inline-flex rounded-full h-2 w-2', dot)} />
                  </span>
                )}
                {!dot && <span className="w-2" />}
                <span className="flex-1 text-left truncate">{label}</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium">
                  {viewCounts[id] ?? 0}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Views */}
        <div>
          <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custom Views</p>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted group">
              <span>Custom demo</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted-foreground/10">
                    <MoreHorizontal size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-primary hover:bg-muted transition-colors">
              <Plus size={14} />
              <span>Create view</span>
            </button>
          </div>
        </div>

        {/* Shared Folders */}
        <Collapsible open={foldersOpen} onOpenChange={setFoldersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shared Folders</p>
            <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', foldersOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-0.5">
              {FOLDERS.map((f) => (
                <button key={f} className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                  <FolderClosed size={15} className="text-muted-foreground" />
                  <span>{f}</span>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tags */}
        <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
            <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', tagsOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-wrap gap-1.5 px-2 pt-1">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs border transition-colors',
                    activeTags.includes(tag)
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
