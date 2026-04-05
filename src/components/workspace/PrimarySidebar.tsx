import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, ListChecks, Sparkles, FolderOpen, FileText, Lock,
  BarChart3, Workflow, Settings, HelpCircle, Plus, PenTool, ArrowRightFromLine, ArrowLeftFromLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const NAV_ITEMS = {
  home: [
    { icon: LayoutGrid, label: 'Dashboard', path: '/workspace' },
    { icon: ListChecks, label: 'My Tasks', path: '/workspace/tasks' },
    { icon: Sparkles, label: 'AI Assistant', path: '/workspace/ai', tint: 'text-purple-500' },
  ],
  documents: [
    { icon: LayoutGrid, label: 'Workspace', path: '/workspace', active: true },
    { icon: FileText, label: 'Templates', path: '/workspace/templates' },
    { icon: Lock, label: 'Vault', path: '/workspace/vault' },
  ],
};

const BOTTOM_ITEMS = [
  { icon: BarChart3, label: 'Insights', path: '/workspace/insights' },
  { icon: Workflow, label: 'Automation', path: '/workspace/automation' },
];

const BOTTOM_ITEMS_2 = [
  { icon: Settings, label: 'Settings', path: '/workspace/settings' },
  { icon: HelpCircle, label: 'Get Help', path: '/workspace/help' },
];

export default function PrimarySidebar() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const NavBtn = ({ icon: Icon, label, active, tint, onClick }: {
    icon: React.ElementType; label: string; active?: boolean; tint?: string; onClick: () => void;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'flex items-center gap-3 rounded-lg transition-colors',
            expanded ? 'w-full px-3 py-2 text-sm' : 'w-9 h-9 justify-center',
            active ? 'bg-primary/10 text-primary' : cn('text-muted-foreground hover:bg-muted', tint)
          )}
        >
          <Icon size={18} className="shrink-0" />
          {expanded && <span className="truncate">{label}</span>}
        </button>
      </TooltipTrigger>
      {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );

  return (
    <div className={cn(
      'flex flex-col h-full border-r border-border bg-card shrink-0 transition-all duration-200',
      expanded ? 'w-48' : 'w-[60px]'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-border shrink-0">
        <div className={cn("flex items-center gap-2", !expanded && "justify-center")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
            <PenTool size={16} />
          </div>
          {expanded && (
            <span className="text-lg font-bold tracking-tight">
              Sign<span className="text-primary">It</span>
            </span>
          )}
        </div>
      </div>

      {/* New Document */}
      <div className="flex justify-center px-2 py-3 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            {expanded ? (
              <Button className="w-full gap-2" onClick={() => navigate('/')}>
                <Plus size={16} /> New Document
              </Button>
            ) : (
              <Button size="icon" className="w-9 h-9 rounded-lg" onClick={() => navigate('/')}>
                <Plus size={16} />
              </Button>
            )}
          </TooltipTrigger>
          {!expanded && <TooltipContent side="right">New Document</TooltipContent>}
        </Tooltip>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.home.map(item => (
          <NavBtn key={item.label} icon={item.icon} label={item.label} tint={item.tint} onClick={() => navigate(item.path)} />
        ))}
        <Separator className="my-2" />
        {NAV_ITEMS.documents.map(item => (
          <NavBtn key={item.label} icon={item.icon} label={item.label} active={item.active} onClick={() => navigate(item.path)} />
        ))}
      </div>

      {/* Bottom */}
      <div className="px-2 space-y-1 shrink-0">
        {BOTTOM_ITEMS.map(item => (
          <NavBtn key={item.label} icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
        ))}
        <Separator className="my-1" />
        {BOTTOM_ITEMS_2.map(item => (
          <NavBtn key={item.label} icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                'flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors',
                expanded ? 'w-full px-3 py-2 text-sm' : 'w-9 h-9 justify-center'
              )}
            >
              {expanded ? <ArrowLeftFromLine size={18} /> : <ArrowRightFromLine size={18} />}
              {expanded && <span>Collapse</span>}
            </button>
          </TooltipTrigger>
          {!expanded && <TooltipContent side="right">Expand</TooltipContent>}
        </Tooltip>
      </div>
      <div className="h-2" />
    </div>
  );
}
