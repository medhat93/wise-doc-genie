import React from "react";
import { WorkspaceDocument } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Check, Clock, FileText } from "lucide-react";

/* ── Mock signature fields ── */
interface PlacedField {
  id: string;
  type: "signature" | "initials" | "date" | "name" | "checkbox";
  participantName: string;
  signed: boolean;
  value?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  signedAt?: string;
}

const participantColors: Record<string, string> = {
  "Ahmad Medhat": "border-blue-400 bg-blue-50",
  "Sarah Johnson": "border-rose-400 bg-rose-50",
  "Mike Torres": "border-amber-400 bg-amber-50",
  "Pepper Potts": "border-purple-400 bg-purple-50",
  "Bruce Wayne": "border-slate-400 bg-slate-50",
  "John Smith": "border-emerald-400 bg-emerald-50",
  "Lisa Chen": "border-teal-400 bg-teal-50",
  "David Park": "border-indigo-400 bg-indigo-50",
};

function getMockFields(doc: WorkspaceDocument): PlacedField[] {
  const signers = doc.participants.filter((p) => p.role === "signer");
  const fields: PlacedField[] = [];
  signers.forEach((s, i) => {
    const isSigned = s.status === "signed";
    fields.push(
      {
        id: `sig-${s.id}`, type: "signature", participantName: s.name, signed: isSigned,
        value: isSigned ? s.name : undefined, x: 60, y: 520 + i * 120, w: 200, h: 50,
        signedAt: s.signedAt,
      },
      {
        id: `date-${s.id}`, type: "date", participantName: s.name, signed: isSigned,
        value: isSigned && s.signedAt ? new Date(s.signedAt).toLocaleDateString() : undefined,
        x: 300, y: 530 + i * 120, w: 120, h: 24,
      },
      {
        id: `name-${s.id}`, type: "name", participantName: s.name, signed: isSigned,
        value: isSigned ? s.name : undefined, x: 60, y: 580 + i * 120, w: 160, h: 24,
      },
    );
  });
  return fields;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Mock document content ── */
const MOCK_CLAUSES = [
  { title: "1. Definitions", text: "In this Agreement, unless the context otherwise requires, the following terms shall have the meanings set out below. 'Services' means the professional services to be provided by the Service Provider as described in Schedule A. 'Confidential Information' means any information disclosed by either party that is marked as confidential." },
  { title: "2. Scope of Services", text: "The Service Provider agrees to provide the Services as described in the Statement of Work attached hereto as Schedule A. The Services shall be performed in a professional and workmanlike manner consistent with generally accepted industry standards." },
  { title: "3. Compensation", text: "In consideration for the Services, the Client shall pay the Service Provider the fees set forth in Schedule B. Payment shall be made within thirty (30) days of receipt of a valid invoice. Late payments shall accrue interest at the rate of 1.5% per month." },
  { title: "4. Term and Termination", text: "This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months unless terminated earlier in accordance with this Section. Either party may terminate this Agreement for convenience upon thirty (30) days' prior written notice." },
  { title: "5. Confidentiality", text: "Each party agrees to hold in confidence all Confidential Information received from the other party. This obligation shall survive the termination of this Agreement for a period of three (3) years." },
  { title: "6. Limitation of Liability", text: "In no event shall either party's aggregate liability exceed the total fees paid or payable under this Agreement during the twelve (12) month period preceding the claim. Neither party shall be liable for any indirect, incidental, consequential, or punitive damages." },
  { title: "7. Governing Law", text: "This Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia, without regard to its conflict of laws principles." },
];

/* ── Watermark ── */
function Watermark({ text, color }: { text: string; color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {[0, 600, 1200].map((top) => (
        <div
          key={top}
          className={cn("absolute left-1/2 -translate-x-1/2 text-[72px] font-bold uppercase tracking-[12px] select-none", color)}
          style={{ top: `${top}px`, transform: `translate(-50%, 0) rotate(-30deg)`, opacity: 0.12 }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}

/* ── Sub-document tab ── */
interface SubDoc {
  id: string;
  name: string;
  type: "Primary" | "Supplement";
}

export default function DocumentViewCanvas({ doc, zoom }: { doc: WorkspaceDocument; zoom: number }) {
  const fields = getMockFields(doc);
  const isTerminal = ["voided", "expired", "declined"].includes(doc.stage);

  const subDocs: SubDoc[] = [
    { id: "main", name: doc.name, type: "Primary" },
    { id: "supp1", name: "Schedule A — Scope of Work", type: "Supplement" },
  ];

  return (
    <div className="py-8 px-4" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
      {subDocs.map((sd, docIdx) => (
        <div key={sd.id} className="mb-8">
          {/* Document divider for supplements */}
          {sd.type === "Supplement" && (
            <div className="max-w-[816px] mx-auto mb-2 flex items-center gap-2 text-xs text-amber-600">
              <FileText size={12} />
              <span className="font-medium">{sd.name}</span>
              <span className="bg-amber-100 text-amber-700 px-1.5 py-0 rounded text-[10px] font-medium">Supplement</span>
            </div>
          )}

          <div
            className={cn(
              "max-w-[816px] mx-auto bg-card shadow-sm rounded-lg relative",
              sd.type === "Supplement" && "border-l-[3px] border-l-amber-400"
            )}
          >
            {/* Watermark for terminal states */}
            {isTerminal && docIdx === 0 && (
              <Watermark
                text={doc.stage === "voided" ? "VOIDED" : doc.stage === "expired" ? "EXPIRED" : "DECLINED"}
                color={doc.stage === "expired" ? "text-amber-500" : "text-red-500"}
              />
            )}

            {/* Document content */}
            <div className="p-12 relative z-0">
              {docIdx === 0 ? (
                <>
                  {/* Title */}
                  <h1 className="text-xl font-bold text-center mb-2">{doc.name}</h1>
                  <p className="text-center text-sm text-muted-foreground mb-8">
                    {doc.category} · Effective Date: {formatDate(doc.createdAt)}
                  </p>

                  {/* Clauses */}
                  {MOCK_CLAUSES.map((clause) => (
                    <div key={clause.title} className="mb-6">
                      <h3 className="text-sm font-semibold mb-1.5">{clause.title}</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">{clause.text}</p>
                    </div>
                  ))}

                  {/* Signature block */}
                  <div className="mt-12 border-t pt-8">
                    <h3 className="text-sm font-semibold mb-6">Signatures</h3>
                    <div className="grid grid-cols-2 gap-8">
                      {fields.filter((f) => f.type === "signature").map((field) => {
                        const colors = participantColors[field.participantName] || "border-gray-400 bg-gray-50";
                        return (
                          <div key={field.id}>
                            {field.signed ? (
                              <div className="space-y-1">
                                <div className="border-b-2 border-foreground/20 pb-2 mb-1">
                                  <p className="text-lg font-script italic text-foreground">{field.value}</p>
                                </div>
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                  <Check size={10} /> Signed by {field.participantName} · {field.signedAt ? formatDate(field.signedAt) : ""}
                                </p>
                                <p className="text-xs text-muted-foreground">{field.participantName}</p>
                              </div>
                            ) : (
                              <div className={cn("border-2 border-dashed rounded-md p-4 flex flex-col items-center gap-1", colors)}>
                                <Clock size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Pending</span>
                                <span className="text-[10px] text-muted-foreground">{field.participantName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Supplement content */
                <>
                  <h2 className="text-lg font-bold mb-4">{sd.name}</h2>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                    This Schedule A outlines the scope of work and deliverables for the services described in the Master Agreement. The Service Provider shall deliver the following services within the timeframes specified below.
                  </p>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3">
                      <p className="text-sm font-medium">Phase 1: Discovery & Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: 4 weeks · Deliverables: Requirements document, gap analysis report</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm font-medium">Phase 2: Implementation</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: 8 weeks · Deliverables: Solution deployment, integration testing</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm font-medium">Phase 3: Training & Handover</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: 2 weeks · Deliverables: Training materials, knowledge transfer sessions</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
