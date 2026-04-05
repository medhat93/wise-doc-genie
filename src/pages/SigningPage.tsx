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
import DocumentNavigator from '@/components/signing/DocumentNavigator';
import SupplementDocument from '@/components/signing/SupplementDocument';
import AttachmentDocument from '@/components/signing/AttachmentDocument';
import SigningRequirementsDialog from '@/components/signing/SigningRequirementsDialog';
import { SIGNING_DOCUMENTS } from '@/components/signing/signingDocuments';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SigningPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState(SIGNING_DOCUMENTS[0].id);
  const [acceptedDocs, setAcceptedDocs] = useState<Set<string>>(new Set());
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [docTransition, setDocTransition] = useState(true);
  const documentRef = useRef<HTMLDivElement>(null);

  const activeDoc = SIGNING_DOCUMENTS.find(d => d.id === activeDocId)!;
  const signedFieldCount = signed ? 4 : 0;

  // Check all requirements met
  const allAccepted = SIGNING_DOCUMENTS.filter(d => d.ack === 'must_view_accept').every(d => acceptedDocs.has(d.id));
  const allRequirementsMet = allAccepted && signed;
  const canSign = allAccepted; // can open signing modal once supplements are accepted

  // Requirements not met items for tooltip
  const pendingItems = SIGNING_DOCUMENTS.filter(d => d.ack !== 'none').map(doc => {
    if (doc.ack === 'sign') return { label: `Complete 4 signature fields on ${doc.name}`, done: signed };
    return { label: `Accept ${doc.name}`, done: acceptedDocs.has(doc.id) };
  });

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
    // Switch to MSA if needed
    if (activeDocId !== 'msa') {
      setActiveDocId('msa');
    }
    setHighlightedSection(section);
    const el = document.getElementById(`nda-section-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedSection(null), 4000);
  }, [activeDocId]);

  const handleSign = () => {
    if (!allAccepted) {
      setReqDialogOpen(true);
      return;
    }
    setSigningModalOpen(true);
  };

  const handleSignatureApply = (data: string) => {
    setSignatureData(data);
    setSigned(true);
    setSigningModalOpen(false);
    setTimeout(() => setShowComplete(true), 800);
  };

  const handleFieldClick = () => {
    if (!signed) {
      if (!allAccepted) {
        setReqDialogOpen(true);
        return;
      }
      setSigningModalOpen(true);
    }
  };

  const handleSelectDoc = (docId: string) => {
    if (docId === activeDocId) return;
    setDocTransition(false);
    setTimeout(() => {
      setActiveDocId(docId);
      setDocTransition(true);
    }, 50);
  };

  const handleAcceptDoc = (docId: string) => {
    setAcceptedDocs(prev => new Set([...prev, docId]));
    toast.success(`${SIGNING_DOCUMENTS.find(d => d.id === docId)?.name} accepted`);
    // Auto-advance to next doc after 1s
    setTimeout(() => {
      const idx = SIGNING_DOCUMENTS.findIndex(d => d.id === docId);
      if (idx < SIGNING_DOCUMENTS.length - 1) {
        handleSelectDoc(SIGNING_DOCUMENTS[idx + 1].id);
      }
    }, 1000);
  };

  const requiresReviewCount = SIGNING_DOCUMENTS.filter(d => d.ack === 'must_view_accept').length;

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
          <p className="text-xs text-muted-foreground">{SIGNING_DOCUMENTS.length} documents · {requiresReviewCount} require your review</p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={handleSign}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold gap-2"
                disabled={signed}
              >
                <PenTool size={14} />
                {signed ? 'Signed ✓' : 'Sign Document'}
              </Button>
            </div>
          </TooltipTrigger>
          {!signed && (
            <TooltipContent side="bottom" className="max-w-[280px]">
              {allAccepted ? (
                <p className="text-xs">Ready to sign!</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Complete these items to sign:</p>
                  {pendingItems.map((item, i) => (
                    <p key={i} className="text-xs">{item.done ? '✓' : '☐'} {item.label}</p>
                  ))}
                </div>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Document Navigator (desktop, left side) */}
        {!isMobile && (
          <DocumentNavigator
            documents={SIGNING_DOCUMENTS}
            activeDocId={activeDocId}
            onSelectDoc={handleSelectDoc}
            acceptedDocs={acceptedDocs}
            signedFieldCount={signedFieldCount}
          />
        )}

        {/* Document Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile doc chips */}
          {isMobile && (
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border bg-card shrink-0">
              {SIGNING_DOCUMENTS.map(doc => {
                const isActive = doc.id === activeDocId;
                const isDone = doc.ack === 'none' || acceptedDocs.has(doc.id) || (doc.ack === 'sign' && signed);
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 transition-colors',
                      isActive ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {isDone && <span className="text-green-600">✓</span>}
                    <span className="max-w-[120px] truncate">{doc.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* File info bar */}
          <div className="h-10 flex items-center gap-3 px-6 border-b border-border bg-card shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
              <FileText size={14} className="text-primary" />
            </div>
            <span className="text-sm font-medium">{activeDoc.name}</span>
            <span className={cn(
              'text-[9px] px-1.5 rounded font-medium',
              activeDoc.type === 'primary' ? 'bg-indigo-100 text-indigo-700' :
              activeDoc.type === 'supplement' ? 'bg-amber-100 text-amber-700' :
              'bg-muted text-muted-foreground'
            )}>
              {activeDoc.type.charAt(0).toUpperCase() + activeDoc.type.slice(1)}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{activeDoc.pages} pages</span>
          </div>

          {/* Document canvas */}
          <div
            ref={documentRef}
            className={cn(
              'flex-1 overflow-y-auto bg-slate-50 py-8 px-4 transition-opacity duration-200',
              docTransition ? 'opacity-100' : 'opacity-0'
            )}
          >
            {activeDoc.ack === 'sign' && (
              <NDADocument
                highlightedSection={highlightedSection}
                signed={signed}
                signatureData={signatureData}
                onFieldClick={handleFieldClick}
              />
            )}
            {activeDoc.ack === 'must_view_accept' && (
              <SupplementDocument
                key={activeDoc.id}
                doc={activeDoc}
                accepted={acceptedDocs.has(activeDoc.id)}
                onAccept={handleAcceptDoc}
              />
            )}
            {activeDoc.ack === 'none' && <AttachmentDocument />}
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

      {/* Requirements Dialog */}
      <SigningRequirementsDialog
        open={reqDialogOpen}
        onClose={() => setReqDialogOpen(false)}
        onGoToDoc={(docId) => handleSelectDoc(docId)}
        acceptedDocs={acceptedDocs}
        signed={signed}
      />

      {/* Completion overlay */}
      {showComplete && (
        <SigningComplete
          acceptedDocs={acceptedDocs}
          signed={signed}
          onGoBack={() => navigate('/?signed=true')}
        />
      )}
    </div>
  );
}
