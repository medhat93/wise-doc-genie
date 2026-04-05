import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Send, Download, Tag, FolderInput, Archive, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Props {
  count: number;
  onDeselect: () => void;
}

export default function BulkActionBar({ count, onDeselect }: Props) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xl"
        >
          <span className="text-sm font-medium">{count} selected</span>
          <button onClick={onDeselect} className="hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
          <Separator orientation="vertical" className="h-5 bg-background/20" />
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/10 gap-1.5 text-xs">
            <Send size={13} /> Send
          </Button>
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/10 gap-1.5 text-xs">
            <Download size={13} /> Download
          </Button>
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/10 gap-1.5 text-xs">
            <Tag size={13} /> Tag
          </Button>
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/10 gap-1.5 text-xs">
            <FolderInput size={13} /> Move
          </Button>
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/10 gap-1.5 text-xs">
            <Archive size={13} /> Archive
          </Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 gap-1.5 text-xs">
            <Trash2 size={13} /> Delete
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
