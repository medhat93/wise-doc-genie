import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface Props {
  onOpen: () => void;
  onDismiss: () => void;
}

export default function SigningAINudge({ onOpen, onDismiss }: Props) {
  return (
    <div className="absolute right-full mr-3 top-0 w-[220px] bg-card shadow-lg border border-border rounded-lg overflow-hidden animate-slide-in-right z-50">
      {/* Gradient bar */}
      <div className="h-[3px] bg-gradient-to-r from-primary to-purple-500" />

      <div className="p-3 relative">
        <button onClick={onDismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={12} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={14} className="text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Let AI help you understand this document before signing
        </p>

        <Button size="sm" className="w-full gap-1.5 text-xs" onClick={onOpen}>
          Summarize for me ✨
        </Button>
      </div>

      {/* Arrow pointing right */}
      <div className="absolute top-4 -right-[6px] w-3 h-3 bg-card border-r border-t border-border rotate-45" />
    </div>
  );
}
