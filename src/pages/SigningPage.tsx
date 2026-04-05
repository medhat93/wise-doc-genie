import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PenTool, FileText, Printer, Download, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import SigningAIPanel from '@/components/signing/SigningAIPanel';
import SigningAINudge from '@/components/signing/SigningAINudge';
import SigningModal from '@/components/signing/SigningModal';
import SigningComplete from '@/components/signing/SigningComplete';
import NDADocument from '@/components/signing/NDADocument';

export default function SigningPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Show nudge after 1.5s
  useEffect(() => {
    const t = setTimeout(() => {
      if (!nudgeDismissed && !aiPanelOpen) setShowNudge(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [nudgeDismissed, aiPanelOpen]);

  const handleOpenAI = () => {
    setAiPanelOpen(true);
    setShowNudge(false);
    setNudgeDismissed(true);
  };

  const handleCitation = useCallback((section: string) => {
    setHighlightedSection(section);
    // Scroll to section
    const el = document.getElementById(`nda-section-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedSection(null), 4000);
  }, []);

  const handleSign = () => setSigningModalOpen(true);

  const handleSignatureApply = (data: string) => {
    setSignatureData(data);
    setSigned(true);
    setSigningModalOpen(false);
    // Show completion after brief delay
    setTimeout(() => setShowComplete(true), 800);
  };

  const handleFieldClick = () => {
    if (!signed) setSigningModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
              <PenTool size={14} />
            </div>
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              Sign<span className="text-primary">It</span>
            </span>
          </div>
        </div>

        <div className="text-center hidden md:block">
          <p className="text-sm font-medium">Mutual NDA — Meridian Data Systems</p>
          <p className="text-xs text-muted-foreground">1 document to sign</p>
        </div>

        <Button
          onClick={handleSign}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold gap-2"
          disabled={signed}
        >
          <PenTool size={14} />
          {signed ? 'Signed ✓' : 'Sign Document'}
        </Button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Document Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File info bar */}
          <div className="h-10 flex items-center gap-3 px-6 border-b border-border bg-card shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
              <FileText size={14} className="text-primary" />
            </div>
            <span className="text-sm font-medium">NDA_AcmeCorp_2025.pdf</span>
            <span className="text-sm text-muted-foreground">3 pages • Uploaded by Acme Corporation</span>
          </div>

          {/* Document canvas */}
          <div ref={documentRef} className="flex-1 overflow-y-auto bg-slate-50 py-8 px-4">
            <NDADocument
              highlightedSection={highlightedSection}
              signed={signed}
              signatureData={signatureData}
              onFieldClick={handleFieldClick}
            />
          </div>
        </div>

        {/* Vertical Toolbar */}
        <div className="w-12 border-l border-border bg-card flex flex-col items-center py-3 gap-2 shrink-0">
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleOpenAI}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                    aiPanelOpen
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary hover:from-primary/30 hover:to-purple-500/30'
                  )}
                >
                  <Sparkles size={18} />
                  {!aiPanelOpen && !nudgeDismissed && (
                    <span className="absolute inset-0 rounded-lg ring-2 ring-primary/50 animate-ping" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">AI Assistant</TooltipContent>
            </Tooltip>

            {/* AI Nudge */}
            {showNudge && !nudgeDismissed && (
              <SigningAINudge
                onOpen={handleOpenAI}
                onDismiss={() => { setShowNudge(false); setNudgeDismissed(true); }}
              />
            )}
          </div>

          <div className="w-6 border-t border-border my-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => window.print()} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Printer size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Print</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => toast.success('Document downloaded')} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Download size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Download</TooltipContent>
          </Tooltip>
        </div>

        {/* AI Panel */}
        {aiPanelOpen && (
          <SigningAIPanel
            onClose={() => setAiPanelOpen(false)}
            onCitation={handleCitation}
          />
        )}
      </div>

      {/* Signing Modal */}
      <SigningModal
        open={signingModalOpen}
        onClose={() => setSigningModalOpen(false)}
        onApply={handleSignatureApply}
      />

      {/* Completion overlay */}
      {showComplete && (
        <SigningComplete onGoBack={() => {
          navigate('/?signed=true');
        }} />
      )}
    </div>
  );
}
