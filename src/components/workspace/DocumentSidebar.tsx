import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  LayoutGrid, Share2, Send, Trash2, Clock, Plus, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { SidebarView, QuickLink } from '@/types/workspace';

interface Props {
  activeView: SidebarView;
  activeQuickLink: QuickLink | null;
  onViewChange: (view: SidebarView) => void;
  onQuickLinkChange: (link: QuickLink | null) => void;
  activeTags: string[];
  onTagToggle: (tag: string) => void;
}

const QUICK_LINKS: { id: QuickLink; label: string; icon: React.ElementType }[] = [
  { id: 'my_documents', label: 'My Documents', icon: LayoutGrid },
  { id: 'shared_with_me', label: 'Shared with me', icon: Share2 },
  { id: 'bulk_send', label: 'Bulk Send', icon: Send },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const VIEWS: { id: SidebarView; label: string; dot?: string; pulse?: boolean; tooltip?: string }[] = [
  { id: 'in_signing', label: 'In Signing', dot: 'bg-blue-500', tooltip: 'Documents currently being signed' },
  { id: 'in_approval', label: 'In Approval', dot: 'bg-indigo-500', tooltip: 'Documents currently being approved' },
  { id: 'requires_action', label: 'Requires your action', dot: 'bg-amber-500', pulse: true, tooltip: 'Documents that need your action — signing, approval, or tasks' },
  { id: 'owned', label: 'Owned by me', tooltip: 'Documents where you are the sender' },
  { id: 'expiring', label: 'Expiring soon', dot: 'bg-red-500', tooltip: 'Signatures expiring within 30 days' },
  { id: 'completed', label: 'Completed', dot: 'bg-green-500', tooltip: 'Completed signature documents' },
];

const TAGS = ['arbitration', 'assignment', 'urgent', 'NDA', 'renewal', 'VIP client'];

export default function DocumentSidebar({
  activeView, activeQuickLink, onViewChange, onQuickLinkChange,
  activeTags, onTagToggle,
}: Props) {
  const [tagsOpen, setTagsOpen] = useState(false);

  const Item = ({ icon: Icon, label, active, onClick }: {
    icon?: React.ElementType; label: string; active: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors relative',
        active ? 'bg-primary/5 text-primary font-medium' : 'text-foreground hover:bg-muted'
      )}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />}
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  );

  return (
    <div className="w-[240px] h-full border-r border-border bg-card overflow-y-auto shrink-0">
      <div className="p-3 space-y-4">
        {/* Quick Links */}
        <div className="space-y-0.5">
          {QUICK_LINKS.map(({ id, label, icon }) => (
            <Item
              key={id}
              icon={icon}
              label={label}
              active={activeQuickLink === id}
              onClick={() => {
                onQuickLinkChange(activeQuickLink === id ? null : id);
                onViewChange('all');
              }}
            />
          ))}
        </div>

        {/* Views */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Views</p>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-0.5">
            {VIEWS.map(({ id, label, dot, pulse, tooltip }) => (
              <Tooltip key={id} delayDuration={400}>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      onClick={() => {
                        onViewChange(activeView === id ? 'all' : id);
                        onQuickLinkChange(null);
                      }}
                      className={cn(
                        'flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors relative',
                        activeView === id ? 'bg-primary/5 text-primary font-medium' : 'text-foreground hover:bg-muted'
                      )}
                    >
                      {activeView === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />}
                      {dot ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          {pulse && <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', dot)} />}
                          <span className={cn('relative inline-flex rounded-full h-2 w-2', dot)} />
                        </span>
                      ) : (
                        <span className="w-2" />
                      )}
                      <span className="flex-1 text-left truncate">{label}</span>
                    </button>
                  </div>
                </TooltipTrigger>
                {tooltip && (
                  <TooltipContent side="right" className="text-xs max-w-[200px]">
                    {tooltip}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </div>

        {/* My Views */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">My Views</p>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted group cursor-pointer">
              <span>Custom demo</span>
              <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </div>
          </div>
        </div>

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
