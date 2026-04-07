import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutGrid, Users, Send, Trash2, Clock, Plus, FolderClosed, ChevronDown,
  PanelLeftClose, PanelLeft, PenTool, Share2
} from 'lucide-react';
import { SidebarView, QuickLink } from '@/types/workspace';

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
  { id: 'my_documents', label: 'My Documents', icon: LayoutGrid },
  { id: 'shared_with_me', label: 'Shared with me', icon: Share2 },
  { id: 'bulk_send', label: 'Bulk Send', icon: Send },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const VIEWS: { id: SidebarView; label: string; dot?: string; pulse?: boolean; icon?: React.ElementType }[] = [
  { id: 'in_signing', label: 'In Signing', dot: 'bg-blue-500' },
  { id: 'in_approval', label: 'In Approval', dot: 'bg-indigo-500' },
  { id: 'requires_action', label: 'Requires your action', dot: 'bg-amber-500', pulse: true },
  { id: 'owned', label: 'Owned by you' },
  { id: 'expiring', label: 'Expiring soon', dot: 'bg-red-500' },
  { id: 'completed', label: 'Completed', dot: 'bg-green-500' },
];

const FOLDERS = ['Technical Team', 'Sales team', 'Legal Department', 'HR Documents'];
const TAGS = ['arbitration', 'assignment', 'urgent', 'NDA', 'renewal', 'VIP client'];

export default function WorkspaceSidebar({
  activeView, activeQuickLink, onViewChange, onQuickLinkChange,
  activeTags, onTagToggle, viewCounts
}: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const SidebarItem = ({ icon: Icon, label, active, onClick, dot, pulse, count }: {
    icon?: React.ElementType; label: string; active: boolean; onClick: () => void;
    dot?: string; pulse?: boolean; count?: number;
  }) => {
    const btn = (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-md px-3 py-1.5 text-sm transition-colors relative',
          active
            ? 'bg-primary/5 text-primary font-medium'
            : 'text-foreground hover:bg-muted'
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
        )}
        {dot && (
          <span className="relative flex h-2 w-2 shrink-0">
            {pulse && <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', dot)} />}
            <span className={cn('relative inline-flex rounded-full h-2 w-2', dot)} />
          </span>
        )}
        {!dot && Icon && <Icon size={16} className="shrink-0" />}
        {!dot && !Icon && <span className="w-2" />}
        {expanded && <span className="flex-1 text-left truncate">{label}</span>}
        {expanded && count !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium">{count}</Badge>
        )}
      </button>
    );

    if (!expanded) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r border-border bg-card transition-all duration-200 shrink-0',
        expanded ? 'w-[240px]' : 'w-[60px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <PenTool size={16} />
        </div>
        {expanded && (
          <span className="text-lg font-bold tracking-tight">
            Sign<span className="text-primary">It</span>
          </span>
        )}
      </div>

      {/* New Document */}
      <div className="px-3 py-3 shrink-0">
        {expanded ? (
          <Button className="w-full gap-2" onClick={() => navigate('/')}>
            <Plus size={16} /> New Document
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="w-full" onClick={() => navigate('/')}>
                <Plus size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Document</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {/* Quick Links */}
        <div className="space-y-0.5">
          {QUICK_LINKS.map(({ id, label, icon }) => (
            <SidebarItem
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
          <div className="flex items-center justify-between px-3 mb-1.5">
            {expanded && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Views</p>
            )}
            {expanded && (
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={12} />
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {VIEWS.map(({ id, label, dot, pulse, icon }) => (
              <SidebarItem
                key={id}
                icon={icon}
                label={label}
                active={activeView === id}
                onClick={() => {
                  onViewChange(activeView === id ? 'all' : id);
                  onQuickLinkChange(null);
                }}
                dot={dot}
                pulse={pulse}
                count={viewCounts[id]}
              />
            ))}
          </div>
        </div>

        {/* My Views */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            {expanded && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">My Views</p>
            )}
            {expanded && (
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={12} />
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            <SidebarItem
              label="Custom demo"
              active={false}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Shared Folders */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            {expanded && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shared Folders</p>
            )}
            {expanded && (
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Share2 size={12} />
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {FOLDERS.map((f) => (
              <SidebarItem
                key={f}
                icon={FolderClosed}
                label={f}
                active={false}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Tags */}
        {expanded && (
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
              <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', tagsOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-1.5 px-3 pt-1">
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
        )}
      </div>

      {/* Bottom: collapse toggle */}
      <div className="px-2 py-2 border-t border-border shrink-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          {expanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          {expanded && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
