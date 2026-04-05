import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EditorProvider } from "@/components/editor/EditorContext";
import CreateDocument from "./pages/CreateDocument";
import ParticipantsPage from "./pages/ParticipantsPage";
import EditorPage from "./pages/EditorPage";
import WorkspacePage from "./pages/WorkspacePage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <EditorProvider>
        <Routes>
          <Route path="/" element={<CreateDocument />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </EditorProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
