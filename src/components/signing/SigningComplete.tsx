import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Props {
  onGoBack: () => void;
}

export default function SigningComplete({ onGoBack }: Props) {
  useEffect(() => {
    const t = setTimeout(onGoBack, 5000);
    return () => clearTimeout(t);
  }, [onGoBack]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-4 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold">Document signed!</h2>
        <p className="text-muted-foreground">Your signature has been recorded</p>
        <Button onClick={onGoBack} className="mt-4">
          Back to workspace
        </Button>
      </div>
    </div>
  );
}
