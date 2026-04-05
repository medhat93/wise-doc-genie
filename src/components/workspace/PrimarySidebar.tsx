import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid, ListChecks, Sparkles, FolderOpen, FileText, Lock,
  BarChart3, Workflow, Settings, HelpCircle, PanelLeftClose, PanelLeft, Plus, PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  {
    label: 'Home',
    items: [
      { icon: LayoutGrid, label: 'Dashboard', path: '/workspace' },
      { icon: ListChecks, label: 'My Tasks', path: '/workspace/tasks' },
      { icon: Sparkles, label: 'AI Assistant', path: '/workspace/ai' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { icon: FolderOpen, label: 'Workspace', path: '/workspace' },
      { icon: FileText, label: 'Templates', path: '/workspace/templates' },
      { icon: Lock, label: 'Vault', path: '/workspace/vault' },
    ],
  },
];

const BOTTOM_ITEMS = [
  { icon: BarChart3, label: 'Insights', path: '/workspace/insights' },
  { icon: Workflow, label: 'Automation', path: '/workspace/automation' },
  { icon: Settings, label: 'Settings', path: '/workspace/settings' },
  { icon: HelpCircle, label: 'Get Help', path: '/workspace/help' },
];

export default function PrimarySidebar() {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ icon: Icon, label, path }: { icon: React.ElementType; label: string; path: string }) => {
    const active = isActive(path);
    const btn = (
      <button
        onClick={() => navigate(path)}
        className={cn(
          'flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors',
          active ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground hover:bg-muted'
        )}
      >
        <Icon size={18} className="shrink-0" />
        {expanded && <span className="truncate">{label}</span>}
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
        'flex flex-col h-full border-r border-border bg-sidebar-background transition-all duration-200 shrink-0',
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

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {expanded && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-border space-y-0.5 shrink-0">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
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
