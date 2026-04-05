import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const AUTO_SUMMARY = `Here's a summary of the key points in this Non-Disclosure Agreement:

• **Parties involved:** This NDA is between Acme Corporation (Disclosing Party) and Meridian Data Systems GmbH (Receiving Party) [p.1]

• **Confidential Information:** Covers all non-public technical, business, and financial information disclosed by either party [p.2]

• **Obligations:** The receiving party must protect confidential information with the same care as their own, and may only use it for the stated business purpose [p.2]

• **Term:** The agreement lasts for 2 years from the effective date, with confidentiality obligations surviving for 3 additional years after termination [p.3]

• **Governing Law:** The agreement is governed by the laws of the State of California [p.3]

⚠️ **Notable clauses:** The non-compete section restricts the receiving party from soliciting employees of the disclosing party for 12 months after termination.`;

const MOCK_RESPONSES: Record<string, string> = {
  'What if I breach this?': `If you breach this NDA, several consequences may apply:

• **Injunctive Relief:** The disclosing party can seek immediate court orders to prevent further disclosure [p.2]

• **Monetary Damages:** You may be liable for actual damages suffered by the disclosing party, including lost profits and business opportunities [p.2]

• **Legal Costs:** The breaching party typically bears the costs of enforcement, including attorney fees [p.3]

• **Termination Rights:** The non-breaching party can immediately terminate the agreement [p.3]

The agreement specifies that monetary damages alone may be insufficient, allowing the disclosing party to pursue equitable remedies without posting a bond.`,

  'Can they change the terms?': `Regarding amendments to this agreement:

• **Written Consent Required:** Any modification to this agreement must be in writing and signed by both parties [p.3]

• **No Oral Amendments:** Verbal agreements or informal emails cannot modify the terms — only formal written amendments are valid [p.3]

• **Both Parties Must Agree:** Neither party can unilaterally change the terms. Any amendment requires mutual written consent.

This is a standard clause that protects both parties from unauthorized changes.`,

  'What are the exclusions?': `The following types of information are explicitly **excluded** from the definition of Confidential Information:

• **Publicly Available:** Information that is or becomes publicly known through no fault of the receiving party [p.2]

• **Prior Knowledge:** Information the receiving party already knew before it was disclosed [p.2]

• **Independent Development:** Information independently developed without using the disclosing party's confidential information [p.2]

• **Third-Party Source:** Information rightfully received from a third party without restriction on disclosure [p.2]

These exclusions are standard and provide reasonable protection for both parties.`,

  'How do I terminate early?': `To terminate this agreement early:

• **30-Day Written Notice:** Either party can terminate by providing 30 days' written notice to the other party [p.3]

• **Surviving Obligations:** Even after termination, confidentiality obligations continue for 3 additional years [p.3]

• **Return of Materials:** Upon termination, you must promptly return or destroy all confidential information and any copies [p.3]

• **Non-Solicitation Survives:** The 12-month non-solicitation period continues to run even after early termination [p.3]

Note that termination does not release you from obligations regarding information already received.`,
};

const CHIPS = [
  'What if I breach this?',
  'Can they change the terms?',
  'What are the exclusions?',
  'How do I terminate early?',
];

interface Props {
  onClose: () => void;
  onCitation: (section: string) => void;
}

export default function SigningAIPanel({ onClose, onCitation }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(true);
  const [summaryShown, setSummaryShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-summary on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setThinking(false);
      setSummaryShown(true);
      setMessages([{ id: 'summary', role: 'ai', content: AUTO_SUMMARY }]);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const response = MOCK_RESPONSES[text] || `That's a great question about the NDA. Based on my analysis of the document, the relevant sections address this concern. I'd recommend reviewing sections 1-4 for the complete context [p.2] [p.3].`;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response }]);
      setThinking(false);
    }, 1200);
  };

  // Render citation badges
  const renderContent = (content: string) => {
    const parts = content.split(/(\[p\.\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[p\.(\d+)\]/);
      if (match) {
        const page = match[1];
        return (
          <button
            key={i}
            onClick={() => onCitation(`p${page}`)}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer mx-0.5"
            title="Click to view in document"
          >
            p.{page}
          </button>
        );
      }
      return <ReactMarkdown key={i} className="inline prose prose-sm max-w-none [&>p]:inline [&>ul]:mt-2 [&>ul]:mb-2 [&_li]:text-sm [&_strong]:text-foreground">{part}</ReactMarkdown>;
    });
  };

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start gap-2')}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-primary" />
              </div>
            )}
            <div className={cn(
              'max-w-[90%] rounded-lg px-3 py-2 text-sm',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted/50'
            )}>
              {msg.role === 'ai' ? (
                <div className="space-y-1 leading-relaxed">{renderContent(msg.content)}</div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-primary" />
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Follow-up chips */}
        {summaryShown && !thinking && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground hover:bg-muted transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(input.trim()); }}}
            placeholder="Ask about this document..."
            className="min-h-[40px] max-h-[80px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            className="shrink-0 h-10 w-10"
            disabled={!input.trim() || thinking}
            onClick={() => input.trim() && sendMessage(input.trim())}
          >
            <Sparkles size={16} />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground italic text-center">
          Responses are generated by AI and are not legal advice
        </p>
      </div>
    </div>
  );
}
