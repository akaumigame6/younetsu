import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { FeedbackData, SurveyData } from '../types';
import { supabase } from '../lib/supabase';

interface ViewerFeedbackContextType {
  viewerId: string | null;
  isAuthReady: boolean;
}

const ViewerFeedbackContext = createContext<ViewerFeedbackContextType | undefined>(undefined);

export const ViewerFeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Supabase 匿名ログイン
  useEffect(() => {
    const initAuth = async () => {
      if (!supabase) {
        setIsAuthReady(true);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setViewerId(session.user.id);
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          if (data?.user) {
            setViewerId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to init anonymous auth:', error);
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, []);

  return (
    <ViewerFeedbackContext.Provider value={{ viewerId, isAuthReady }}>
      {children}
    </ViewerFeedbackContext.Provider>
  );
};

export const useViewerFeedback = () => {
  const context = useContext(ViewerFeedbackContext);
  if (!context) {
    throw new Error('useViewerFeedback must be used within a ViewerFeedbackProvider');
  }
  return context;
};
