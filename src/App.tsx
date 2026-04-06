import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorProvider } from "@/components/editor/EditorContext";
import { AnimatePresence } from "framer-motion";
import CreateDocument from "./pages/CreateDocument";

import EditorPage from "./pages/EditorPage";
import WorkspacePage from "./pages/WorkspacePage";
import SigningPage from "./pages/SigningPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <EditorProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<WorkspacePage />} />
            <Route path="/create" element={<CreateDocument />} />
            
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/workspace" element={<Navigate to="/" replace />} />
            <Route path="/signing/:id" element={<SigningPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </EditorProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
