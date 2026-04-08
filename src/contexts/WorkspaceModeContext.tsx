import React, { createContext, useContext, useState } from 'react';

export type WorkspaceMode = 'clm' | 'esign';

interface WorkspaceModeContextType {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  isESign: boolean;
}

const WorkspaceModeContext = createContext<WorkspaceModeContextType>({
  mode: 'clm',
  setMode: () => {},
  isESign: false,
});

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>('clm');
  return (
    <WorkspaceModeContext.Provider value={{ mode, setMode, isESign: mode === 'esign' }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode() {
  return useContext(WorkspaceModeContext);
}
