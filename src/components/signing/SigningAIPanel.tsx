import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const AUTO_SUMMARY = `This signing request contains **4 documents**. Here's a summary of each:

• **Master Services Agreement** — The primary NDA between Acme Corporation and Meridian Data Systems covering confidential information, obligations, and governing law. Contains your signature fields. [MSA p.1]

• **Schedule A — Pricing & Fee Structure** — Details service fees, payment terms, and annual adjustment caps. Requires your review and acceptance. [Schedule A p.1]

• **Confidential Terms Addendum** — Enhanced confidentiality requirements including encryption standards and data handling procedures. Requires your review and acceptance. [Conf. Terms p.1]

• **Insurance Certificate** — Certificate of insurance from Allianz for Meridian Data Systems. Reference only — no action needed.

⚠️ **Action required:** You must accept 2 supplement documents and complete 4 signature fields on the MSA before signing.`;

const MOCK_RESPONSES: Record<string, string> = {
  'What if I breach this?': `If you breach this NDA, several consequences may apply:

• **Injunctive Relief:** The disclosing party can seek immediate court orders to prevent further disclosure [MSA p.2]

• **Monetary Damages:** You may be liable for actual damages suffered by the disclosing party [MSA p.2]

• **Legal Costs:** The breaching party typically bears the costs of enforcement [MSA p.3]

• **Termination Rights:** The non-breaching party can immediately terminate the agreement [MSA p.3]`,

  'Can they change the terms?': `Regarding amendments to this agreement:

• **Written Consent Required:** Any modification must be in writing and signed by both parties [MSA p.3]

• **No Oral Amendments:** Verbal agreements cannot modify the terms [MSA p.3]

• **Both Parties Must Agree:** Neither party can unilaterally change the terms.`,

  'Summarize pricing terms': `Based on **Schedule A — Pricing & Fee Structure**:

• **Platform Access:** $45,000/year per seat [Schedule A p.1]
• **Implementation:** $25,000 one-time [Schedule A p.1]
• **Custom Integration:** $200/hour [Schedule A p.1]
• **Premium Support:** $12,000/year [Schedule A p.1]
• **Annual Increases:** Capped at 5% with 60 days notice [Schedule A p.2]
• **Volume Discounts:** Available for 10+ seat commitments [Schedule A p.2]`,

  'What are the exclusions?': `The following types of information are excluded from Confidential Information:

• **Publicly Available:** Information that becomes public through no fault of the receiving party [MSA p.2]
• **Prior Knowledge:** Information already known before disclosure [MSA p.2]
• **Independent Development:** Information developed without using confidential info [MSA p.2]
• **Third-Party Source:** Information received from a third party without restriction [MSA p.2]`,
};

const CHIPS = [
  'What if I breach this?',
  'Summarize pricing terms',
  'Can they change the terms?',
  'What are the exclusions?',
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
      const response = MOCK_RESPONSES[text] || `That's a great question. Based on my analysis of all 4 documents in this signing request, the relevant sections address this concern. I'd recommend reviewing the MSA sections 1-4 for the complete context [MSA p.2] [MSA p.3].`;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response }]);
      setThinking(false);
    }, 1200);
  };

  const renderContent = (content: string) => {
    // Match citations like [MSA p.1], [Schedule A p.2], [Conf. Terms p.1], [p.1]
    const parts = content.split(/(\[(?:MSA|Schedule A|Conf\. Terms)?\s*p\.\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[((?:MSA|Schedule A|Conf\. Terms)?\s*p\.(\d+))\]/);
      if (match) {
        const label = match[1];
        const page = match[2];
        return (
          <button
            key={i}
            onClick={() => onCitation(`p${page}`)}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer mx-0.5"
            title="Click to view in document"
          >
            {label}
          </button>
        );
      }
      return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />;
    });
  };

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col shrink-0 animate-slide-in-right">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

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
              msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/50'
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

      <div className="p-3 border-t border-border shrink-0 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(input.trim()); }}}
            placeholder="Ask about these documents..."
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
