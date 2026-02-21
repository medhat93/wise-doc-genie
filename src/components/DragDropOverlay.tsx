import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";

const formatPills = ["PDF", "DOCX", "PNG", "JPG"];

const DragDropOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-2 border-dashed border-primary rounded-2xl p-20 flex flex-col items-center ring-4 ring-primary/10 bg-primary/5"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <UploadCloud className="h-14 w-14 text-primary" />
      </motion.div>
      <p className="text-xl font-semibold mt-4">Release to upload</p>
      <p className="text-sm text-muted-foreground mt-2">Your files will be added to the document queue</p>
      <div className="flex items-center gap-2 mt-4">
        {formatPills.map((fmt) => (
          <span
            key={fmt}
            className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground"
          >
            {fmt}
          </span>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default DragDropOverlay;
