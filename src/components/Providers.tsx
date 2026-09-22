"use client";

import { EventSettingsProvider } from '../context/EventSettingsContext';
import { ViewerFeedbackProvider } from '../context/ViewerFeedbackContext';
import Header from './Header';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EventSettingsProvider>
      <ViewerFeedbackProvider>
        <div className="app-container">
          <Header />
          {children}
        </div>
      </ViewerFeedbackProvider>
    </EventSettingsProvider>
  );
}
