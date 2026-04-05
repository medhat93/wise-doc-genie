import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (signatureData: string) => void;
}

const FONT_STYLES = [
  { name: 'Script', className: 'italic font-serif text-2xl' },
  { name: 'Formal', className: 'font-serif text-xl tracking-wide' },
  { name: 'Casual', className: 'italic text-xl font-light' },
  { name: 'Bold', className: 'font-bold text-2xl tracking-tight' },
];

export default function SigningModal({ open, onClose, onApply }: Props) {
  const [tab, setTab] = useState('draw');
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const canApply = agreed && (
    (tab === 'draw' && hasDrawing) ||
    (tab === 'type' && typedName.trim().length > 0) ||
    (tab === 'upload' && uploadedImage)
  );

  // Canvas drawing
  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasDrawing(true);
  }, []);

  const endDraw = useCallback(() => { drawingRef.current = false; }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  // Setup canvas size
  useEffect(() => {
    if (open && tab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 400;
        canvas.height = 150;
      }
    }
  }, [open, tab]);

  const handleApply = () => {
    if (tab === 'draw' && canvasRef.current) {
      onApply(canvasRef.current.toDataURL());
    } else if (tab === 'type') {
      // Create text-based signature
      onApply(`typed:${typedName}:${selectedFont}`);
    } else if (tab === 'upload' && uploadedImage) {
      onApply(uploadedImage);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Complete your signature</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="draw" className="flex-1">Draw</TabsTrigger>
            <TabsTrigger value="type" className="flex-1">Type</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Draw your signature below</p>
            <div className="border-2 border-dashed border-border rounded-lg bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ height: '150px' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
              />
            </div>
            <button onClick={clearCanvas} className="text-sm text-primary hover:underline">Clear</button>
          </TabsContent>

          <TabsContent value="type" className="space-y-3 mt-4">
            <Input
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Type your full name"
            />
            {typedName && (
              <div className="grid grid-cols-2 gap-2">
                {FONT_STYLES.map((style, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFont(i)}
                    className={cn(
                      'border-2 rounded-lg p-4 text-center transition-colors',
                      selectedFont === i ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <span className={style.className}>{typedName}</span>
                    <p className="text-[10px] text-muted-foreground mt-1">{style.name}</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 mt-4">
            <label className="flex flex-col items-center justify-center h-[150px] border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Signature" className="max-h-[120px] max-w-full object-contain" />
              ) : (
                <>
                  <Upload size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload a signature image (PNG, JPG)</p>
                  <p className="text-xs text-muted-foreground">Max size: 2MB</p>
                </>
              )}
              <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleFileUpload} />
            </label>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-2 mt-4">
          <Checkbox
            checked={agreed}
            onCheckedChange={v => setAgreed(v === true)}
            id="agree-signing"
            className="mt-0.5"
          />
          <label htmlFor="agree-signing" className="text-sm text-muted-foreground cursor-pointer leading-tight">
            I agree that this electronic signature is legally binding
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canApply} onClick={handleApply}>Apply signature</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
