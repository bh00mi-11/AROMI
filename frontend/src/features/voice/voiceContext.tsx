import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceContextState {
  current_route: string;
  active_form: string | null;
  draft_fields: Record<string, any>;
  visible_result_ids: number[];
}

interface VoiceContextType {
  context: VoiceContextState;
  updateContext: (updates: Partial<VoiceContextState>) => void;
  setDraftField: (field: string, value: any) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [context, setContext] = useState<VoiceContextState>({
    current_route: window.location.pathname,
    active_form: null,
    draft_fields: {},
    visible_result_ids: [],
  });

  const updateContext = (updates: Partial<VoiceContextState>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const setDraftField = (field: string, value: any) => {
    setContext(prev => ({
      ...prev,
      draft_fields: { ...prev.draft_fields, [field]: value }
    }));
  };

  return (
    <VoiceContext.Provider value={{ context, updateContext, setDraftField }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoiceContext must be used within VoiceProvider");
  return ctx;
};
