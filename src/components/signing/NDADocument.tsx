import React from 'react';
import { cn } from '@/lib/utils';
import { PenTool } from 'lucide-react';

interface Props {
  highlightedSection: string | null;
  signed: boolean;
  signatureData: string | null;
  onFieldClick: () => void;
}

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function NDADocument({ highlightedSection, signed, signatureData, onFieldClick }: Props) {
  const isHighlighted = (id: string) => highlightedSection === id;

  const HighlightWrap = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div
      id={`nda-section-${id}`}
      className={cn(
        'transition-all duration-500 rounded px-1 -mx-1',
        isHighlighted(id) && 'bg-amber-100/50 ring-2 ring-amber-400'
      )}
    >
      {children}
    </div>
  );

  const SignatureField = ({ label, value, wide }: { label: string; value?: string; wide?: boolean }) => (
    <div
      onClick={!signed ? onFieldClick : undefined}
      className={cn(
        'border-2 rounded-md flex items-center justify-center transition-all',
        wide ? 'w-[200px] h-[60px]' : 'w-[180px] h-[36px]',
        signed
          ? 'border-green-400 bg-green-50'
          : 'border-dashed border-primary/60 bg-primary/5 cursor-pointer animate-pulse hover:bg-primary/10',
      )}
    >
      {signed && value ? (
        <span className={cn('text-sm font-medium text-foreground', wide && 'text-lg font-semibold italic')}>{value}</span>
      ) : signed && signatureData && wide ? (
        <img src={signatureData} alt="Signature" className="max-h-[50px] max-w-[180px] object-contain" />
      ) : (
        <span className="text-xs text-primary/60 font-medium">{label}</span>
      )}
      {signed && (
        <span className="ml-2 text-green-600 text-xs">✓</span>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* PAGE 1 */}
      <div className="bg-card rounded-xl shadow border border-border p-10 space-y-6">
        <HighlightWrap id="p1">
          <h1 className="text-2xl font-bold text-center mb-8">NON-DISCLOSURE AGREEMENT</h1>

          <p className="text-sm leading-relaxed text-foreground">
            This Non-Disclosure Agreement ("Agreement") is entered into as of April 4, 2026, by and between:
          </p>

          <div className="my-4 space-y-3 text-sm leading-relaxed">
            <p>
              <strong>Disclosing Party:</strong> Acme Corporation, a Delaware corporation with offices at 123 Innovation Drive,
              San Francisco, CA 94105 ("Acme")
            </p>
            <p>
              <strong>Receiving Party:</strong> Meridian Data Systems GmbH, organized under the laws of Germany, with offices at
              Friedrichstrasse 108, 10117 Berlin ("Meridian")
            </p>
            <p>Collectively referred to as "the Parties."</p>
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold mb-2">PURPOSE</h2>
            <p className="text-sm leading-relaxed">
              The Parties wish to explore a potential business relationship concerning a joint venture in cloud infrastructure
              services (the "Purpose"). In connection with the Purpose, each Party may disclose to the other certain confidential
              and proprietary information. The Parties agree to the following terms and conditions to protect the confidentiality
              of such information.
            </p>
          </div>
        </HighlightWrap>

        <div className="border-b border-border pt-4" />
        <p className="text-xs text-muted-foreground text-center">Page 1 of 3</p>
      </div>

      {/* PAGE 2 */}
      <div className="bg-card rounded-xl shadow border border-border p-10 space-y-6">
        <HighlightWrap id="p2">
          <h2 className="text-base font-semibold mb-3">1. DEFINITION OF CONFIDENTIAL INFORMATION</h2>
          <p className="text-sm leading-relaxed mb-4">
            "Confidential Information" means any and all non-public technical, business, financial, or other information disclosed
            by either Party to the other, whether orally, in writing, electronically, or by inspection of tangible objects, including
            but not limited to: trade secrets, patents, inventions, product designs, business plans, marketing strategies, customer
            lists, financial data, software code, algorithms, and any other information that is designated as "confidential" or that
            reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.
          </p>

          <p className="text-sm leading-relaxed mb-6">
            <strong>Exclusions:</strong> Confidential Information shall not include information that: (a) is or becomes publicly
            available through no fault of the receiving party; (b) was already known to the receiving party prior to disclosure;
            (c) is independently developed by the receiving party without use of or reference to the disclosing party's Confidential
            Information; or (d) is rightfully received from a third party without restriction on disclosure.
          </p>

          <h2 className="text-base font-semibold mb-3">2. OBLIGATIONS OF THE RECEIVING PARTY</h2>
          <p className="text-sm leading-relaxed mb-3">
            The Receiving Party shall: (a) hold the Confidential Information in strict confidence; (b) not disclose the Confidential
            Information to any third party without the prior written consent of the Disclosing Party; (c) protect the Confidential
            Information with the same degree of care it uses to protect its own confidential information, but in no event less than
            reasonable care; and (d) use the Confidential Information solely for the Purpose described herein.
          </p>
          <p className="text-sm leading-relaxed">
            The Receiving Party may disclose Confidential Information only to its employees, officers, directors, and advisors who
            have a need to know such information for the Purpose and who are bound by confidentiality obligations at least as
            restrictive as those contained in this Agreement.
          </p>
        </HighlightWrap>

        <div className="border-b border-border pt-4" />
        <p className="text-xs text-muted-foreground text-center">Page 2 of 3</p>
      </div>

      {/* PAGE 3 */}
      <div className="bg-card rounded-xl shadow border border-border p-10 space-y-6">
        <HighlightWrap id="p3">
          <h2 className="text-base font-semibold mb-3">3. TERM AND TERMINATION</h2>
          <p className="text-sm leading-relaxed mb-3">
            This Agreement shall remain in effect for a period of two (2) years from the Effective Date (the "Term"). Either Party
            may terminate this Agreement at any time upon thirty (30) days' prior written notice to the other Party.
          </p>
          <p className="text-sm leading-relaxed mb-6">
            <strong>Survival:</strong> The confidentiality obligations set forth in this Agreement shall survive termination or
            expiration for a period of three (3) additional years. Upon termination, the Receiving Party shall promptly return or
            destroy all Confidential Information and any copies thereof.
          </p>

          <h2 className="text-base font-semibold mb-3">4. GOVERNING LAW AND JURISDICTION</h2>
          <p className="text-sm leading-relaxed mb-3">
            This Agreement shall be governed by and construed in accordance with the laws of the State of California, United States,
            without regard to its conflict of laws principles. Any dispute arising under or in connection with this Agreement shall be
            subject to the exclusive jurisdiction of the state and federal courts located in San Francisco County, California.
          </p>

          <p className="text-sm leading-relaxed mb-3">
            <strong>Non-Solicitation:</strong> During the term of this Agreement and for a period of twelve (12) months following
            its termination, neither Party shall directly or indirectly solicit or hire any employee of the other Party without prior
            written consent.
          </p>

          {/* Signature Block */}
          <div className="mt-10 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-6">IN WITNESS WHEREOF, the Parties have executed this Agreement:</h3>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Disclosing Party — Acme Corporation</p>
                <div className="w-[200px] h-[60px] border-b-2 border-foreground/20 flex items-end pb-1">
                  <span className="text-sm italic text-muted-foreground">Jane Smith</span>
                </div>
                <p className="text-xs text-muted-foreground">Date: April 4, 2026</p>
                <p className="text-xs text-muted-foreground">Name: Jane Smith</p>
                <p className="text-xs text-muted-foreground">Title: VP of Partnerships</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Receiving Party — Meridian Data Systems</p>
                <SignatureField label="Your Signature" wide />
                <SignatureField label="Date" value={signed ? today : undefined} />
                <SignatureField label="Your Name" value={signed ? 'Ahmed Medhat' : undefined} />
                <SignatureField label="Your Title" value={signed ? 'Managing Director' : undefined} />
              </div>
            </div>
          </div>
        </HighlightWrap>

        <div className="border-b border-border pt-4" />
        <p className="text-xs text-muted-foreground text-center">Page 3 of 3</p>
      </div>
    </div>
  );
}
