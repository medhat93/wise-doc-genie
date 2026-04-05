import React, { useState } from 'react';
import { WorkspaceDocument } from '@/types/workspace';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, Link as LinkIcon, Info } from 'lucide-react';

interface Props {
  doc: WorkspaceDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FollowUpDialog({ doc, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [relType, setRelType] = useState<'child' | 'related'>('child');
  const [childType, setChildType] = useState<'supplement' | 'attachment' | 'amendment'>('amendment');

  if (!doc) return null;

  const handleContinue = () => {
    onOpenChange(false);
    if (relType === 'child') {
      navigate(`/editor?mode=followup&parentId=${doc.id}&childType=${childType}`);
    } else {
      navigate(`/create?relatedTo=${doc.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add follow-up to {doc.name}</DialogTitle>
          <DialogDescription>Create a new contract linked to this completed document</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Relationship Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Relationship type</Label>
            <RadioGroup value={relType} onValueChange={(v) => setRelType(v as 'child' | 'related')} className="space-y-3">
              <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="child" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Child document</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Add a supplement, attachment, or amendment to this contract</p>
                  {relType === 'child' && (
                    <div className="mt-2">
                      <Select value={childType} onValueChange={(v) => setChildType(v as typeof childType)}>
                        <SelectTrigger className="h-8 text-sm w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplement">Supplement</SelectItem>
                          <SelectItem value="attachment">Attachment</SelectItem>
                          <SelectItem value="amendment">Amendment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </label>
              <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="related" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Related contract</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Create a new independent contract related to this one</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* What happens next */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Info size={12} />
              What happens next
            </div>
            {relType === 'child' ? (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>You'll be taken to the editor to add and configure the new {childType}.</li>
                <li>Participants from the original contract will be pre-loaded. You can modify them.</li>
                <li>The original contract's signing order will be preserved.</li>
                <li>The follow-up will appear as a child in the original contract's document list.</li>
              </ul>
            ) : (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>You'll start the full 3-step creation flow for a new signature request.</li>
                <li>A link will be created between the new contract and {doc.name}.</li>
                <li>You'll configure participants and settings from scratch.</li>
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleContinue}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
