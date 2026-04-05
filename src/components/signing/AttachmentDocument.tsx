import React from 'react';

export default function AttachmentDocument() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-xl shadow border border-border p-10 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-8">CERTIFICATE OF INSURANCE</h1>

        <div className="space-y-4 text-sm leading-relaxed">
          <p><strong>Certificate Holder:</strong> Acme Corporation</p>
          <p><strong>Insured:</strong> Meridian Data Systems GmbH</p>
          <p><strong>Policy Number:</strong> CGL-2026-MDS-44821</p>
          <p><strong>Effective Date:</strong> January 1, 2026 — December 31, 2026</p>

          <div className="border-t border-border pt-4 mt-4">
            <h2 className="text-base font-semibold mb-2">COVERAGE SUMMARY</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Commercial General Liability: $2,000,000 per occurrence</li>
              <li>Professional Liability (E&O): $5,000,000 aggregate</li>
              <li>Cyber Liability: $3,000,000 per claim</li>
              <li>Workers' Compensation: Statutory limits</li>
            </ul>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <h2 className="text-base font-semibold mb-2">INSURER</h2>
            <p>Allianz Global Corporate & Specialty SE</p>
            <p className="text-muted-foreground text-xs mt-1">This certificate is issued as a matter of information only and confers no rights upon the certificate holder.</p>
          </div>
        </div>

        <div className="border-b border-border pt-4" />
        <p className="text-xs text-muted-foreground text-center">Page 1 of 1</p>
      </div>
    </div>
  );
}
