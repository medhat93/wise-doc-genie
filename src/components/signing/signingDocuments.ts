export type DocType = 'primary' | 'supplement' | 'attachment';
export type AckType = 'sign' | 'must_view_accept' | 'none';

export interface SigningDocument {
  id: string;
  name: string;
  type: DocType;
  pages: number;
  ack: AckType;
  fieldCount?: number;
}

export const SIGNING_DOCUMENTS: SigningDocument[] = [
  {
    id: 'msa',
    name: 'Master Services Agreement',
    type: 'primary',
    pages: 3,
    ack: 'sign',
    fieldCount: 4,
  },
  {
    id: 'schedule-a',
    name: 'Schedule A — Pricing & Fee Structure',
    type: 'supplement',
    pages: 2,
    ack: 'must_view_accept',
  },
  {
    id: 'confidential-terms',
    name: 'Confidential Terms Addendum',
    type: 'supplement',
    pages: 1,
    ack: 'must_view_accept',
  },
  {
    id: 'insurance',
    name: 'Insurance Certificate',
    type: 'attachment',
    pages: 1,
    ack: 'none',
  },
];
