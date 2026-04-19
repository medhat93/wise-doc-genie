import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PenTool, FileText, Printer, Download, Sparkles, ArrowLeft, MoreHorizontal, XCircle, UserPlus, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import SigningAIPanel from '@/components/signing/SigningAIPanel';
import SigningAINudge from '@/components/signing/SigningAINudge';
import SigningModal from '@/components/signing/SigningModal';
import SigningComplete from '@/components/signing/SigningComplete';
import NDADocument from '@/components/signing/NDADocument';
import DocumentNavigator from '@/components/signing/DocumentNavigator';
import SupplementDocument from '@/components/signing/SupplementDocument';
import AttachmentDocument from '@/components/signing/AttachmentDocument';
import SigningRequirementsDialog from '@/components/signing/SigningRequirementsDialog';
import RejectDocumentDialog from '@/components/signing/RejectDocumentDialog';
import TransferDocumentDialog from '@/components/signing/TransferDocumentDialog';
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
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [docTransition, setDocTransition] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const documentRef = useRef<HTMLDivElement>(null);

  const activeDoc = SIGNING_DOCUMENTS.find(d => d.id === activeDocId)!;
  const signedFieldCount = signed ? 4 : 0;

  // Highlight search matches in document
  useEffect(() => {
    if (!documentRef.current) return;
    // Clear previous highlights
    documentRef.current.querySelectorAll('mark[data-search-hl]').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
    if (!searchQuery || searchQuery.length < 2) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    const walker = document.createTreeWalker(documentRef.current, NodeFilter.SHOW_TEXT);
    const matches: { node: Text; index: number }[] = [];
    const query = searchQuery.toLowerCase();
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const idx = node.textContent?.toLowerCase().indexOf(query) ?? -1;
      if (idx >= 0) matches.push({ node, index: idx });
    }
    const marks: HTMLElement[] = [];
    matches.forEach(({ node, index }) => {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + searchQuery.length);
      const mark = document.createElement('mark');
      mark.setAttribute('data-search-hl', 'true');
      mark.style.backgroundColor = 'hsl(var(--primary) / 0.25)';
      mark.style.borderRadius = '2px';
      mark.style.padding = '0 1px';
      range.surroundContents(mark);
      marks.push(mark);
    });
    setMatchCount(marks.length);
    if (marks.length > 0) {
      setCurrentMatch(1);
      marks[0].style.backgroundColor = 'hsl(var(--primary) / 0.5)';
      marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setCurrentMatch(0);
    }
  }, [searchQuery]);
  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (!documentRef.current || matchCount === 0) return;
    const marks = documentRef.current.querySelectorAll('mark[data-search-hl]');
    // Reset all highlights
    marks.forEach(m => (m as HTMLElement).style.backgroundColor = 'hsl(var(--primary) / 0.25)');
    let next = direction === 'next' ? currentMatch + 1 : currentMatch - 1;
    if (next > matchCount) next = 1;
    if (next < 1) next = matchCount;
    setCurrentMatch(next);
    const target = marks[next - 1] as HTMLElement;
    if (target) {
      target.style.backgroundColor = 'hsl(var(--primary) / 0.5)';
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatch, matchCount]);


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
    if (activeDocId !== 'msa') {
      setActiveDocId('msa');
    }
    setHighlightedSection(section);
    const el = document.getElementById(`nda-section-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedSection(null), 4000);
  }, [activeDocId]);

  const handleSign = () => {
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
      setSigningModalOpen(true);
    }
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    const el = document.getElementById(`signing-doc-${docId}`);
    if (el && documentRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update active doc based on scroll position
  useEffect(() => {
    const container = documentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let current = SIGNING_DOCUMENTS[0].id;
      for (const doc of SIGNING_DOCUMENTS) {
        const el = document.getElementById(`signing-doc-${doc.id}`);
        if (el) {
          const top = el.getBoundingClientRect().top - containerTop;
          if (top <= 100) current = doc.id;
        }
      }
      setActiveDocId(prev => (prev === current ? prev : current));
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
          <p className="text-xs text-muted-foreground">{SIGNING_DOCUMENTS.length} documents</p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MoreHorizontal size={14} />
                <span className="hidden sm:inline">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRejectOpen(true)} className="gap-2 text-destructive focus:text-destructive">
                <XCircle size={14} /> Reject
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTransferOpen(true)} className="gap-2">
                <UserPlus size={14} /> Transfer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleSign}
            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold gap-2"
            disabled={signed}
          >
            <PenTool size={14} />
            {signed ? 'Signed ✓' : 'Sign Document'}
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Document Navigator (desktop, left side) */}
        {!isMobile && (
          <DocumentNavigator
            documents={SIGNING_DOCUMENTS}
            activeDocId={activeDocId}
            onSelectDoc={handleSelectDoc}
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
                const isDone = doc.ack === 'none' || (doc.ack === 'sign' && signed);
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
              'bg-amber-100 text-amber-700'
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
            {activeDoc.ack === 'none' && activeDoc.type === 'supplement' && (
              <SupplementDocument
                key={activeDoc.id}
                doc={activeDoc}
                accepted={true}
                onAccept={() => {}}
              />
            )}
            {activeDoc.ack === 'none' && activeDoc.type !== 'supplement' && <AttachmentDocument />}
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

          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setSearchOpen(v => !v); setSearchQuery(''); setCurrentMatch(0); setMatchCount(0); }}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    searchOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Search size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Search in document</TooltipContent>
            </Tooltip>

            {/* Floating search card */}
            {searchOpen && (
              <div className="absolute right-full mr-3 top-0 w-[260px] bg-card shadow-lg border border-border rounded-lg overflow-hidden z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">Document search</span>
                    <button
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Results {currentMatch} of {matchCount}
                  </p>
                  <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-md px-2.5 py-1.5">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search on document..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
                      autoFocus
                    />
                    {matchCount > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => navigateMatch('next')}
                          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => navigateMatch('prev')}
                          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
        signed={signed}
      />

      {/* Reject Dialog */}
      <RejectDocumentDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onReject={(reason) => {
          setRejectOpen(false);
          toast.error('Document rejected', { description: 'The sender has been notified.' });
        }}
      />

      {/* Transfer Dialog */}
      <TransferDocumentDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransfer={(data) => {
          setTransferOpen(false);
          toast.success('Transfer sent', { description: `Signing request sent to ${data.name} via ${data.method}.` });
        }}
      />

      {/* Completion overlay */}
      {showComplete && (
        <SigningComplete
          signed={signed}
          onGoBack={() => navigate('/?signed=true')}
        />
      )}
    </div>
  );
}
