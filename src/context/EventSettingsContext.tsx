import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { getEvent } from '../actions/event';

interface EventSettings {
  eventId?: string;
  eventName: string;
  eventDesc: string;
  venue: string;
  startDate: string;
  endDate: string;
  eventType: string;
  hasExhibits: boolean;
  exhibitTerm: string;
  hasEventSurvey: boolean;
  customQuestions?: string;
  eventQ2Placeholder?: string;
  eventQ3Placeholder?: string;
  creatorQ2Placeholder?: string;
  creatorQ3Placeholder?: string;
  freeEventPlaceholder?: string;
  freeCreatorPlaceholder?: string;
  referralSources?: string;
  useReadStatus: boolean;
}

interface EventSettingsContextType {
  settings: EventSettings;
  updateSettings: (newSettings: Partial<EventSettings>) => void;
}

const defaultSettings: EventSettings = {
  eventName: '緑市 マルシェ',
  eventDesc: 'このイベントについての説明...',
  venue: '〇〇ギャラリー',
  startDate: '',
  endDate: '',
  eventType: 'group',
  hasExhibits: true,
  exhibitTerm: '作家',
  hasEventSurvey: true,
  customQuestions: '[]',
  eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
  eventQ3Placeholder: '例：色使いがとても綺麗だったから',
  creatorQ2Placeholder: '例：作品の〇〇の表現から',
  creatorQ3Placeholder: '例：不思議な魅力があったから',
  freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
  freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
  referralSources: 'X(旧Twitter),Instagram,ポスター/チラシ,知人の紹介,その他',
  useReadStatus: true,
};

const EventSettingsContext = createContext<EventSettingsContextType | undefined>(undefined);

export const EventSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<EventSettings>(defaultSettings);
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await getEvent(eventId);
        if (data && !error) {
          // DBの YYYY-MM-DD に変換
          let startStr = '';
          let endStr = '';
          const typedData = data as any; // Prismaが自動生成されるまでの回避用
          if (typedData.startDate) {
            startStr = new Date(typedData.startDate).toISOString().split('T')[0];
          } else if (typedData.date) {
            startStr = new Date(typedData.date).toISOString().split('T')[0];
          }
          if (typedData.endDate) {
            endStr = new Date(typedData.endDate).toISOString().split('T')[0];
          } else if (typedData.date) {
            endStr = new Date(typedData.date).toISOString().split('T')[0];
          }

          setSettings({
            eventId: typedData.id,
            eventName: typedData.title || '',
            eventDesc: typedData.description || '',
            venue: typedData.location || '',
            startDate: startStr,
            endDate: endStr,
            eventType: typedData.eventType || 'group',
            hasExhibits: typedData.hasExhibits ?? true,
            exhibitTerm: typedData.exhibitTerm || '作家',
            hasEventSurvey: typedData.hasEventSurvey ?? true,
            customQuestions: typedData.customQuestions || '[]',
            eventQ2Placeholder: typedData.eventQ2Placeholder || '',
            eventQ3Placeholder: typedData.eventQ3Placeholder || '',
            creatorQ2Placeholder: typedData.creatorQ2Placeholder || '',
            creatorQ3Placeholder: typedData.creatorQ3Placeholder || '',
            freeEventPlaceholder: typedData.freeEventPlaceholder || '',
            freeCreatorPlaceholder: typedData.freeCreatorPlaceholder || '',
            referralSources: typedData.referralSources || '',
            useReadStatus: typedData.useReadStatus ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch event settings', err);
      }
    };
    
    fetchEvent();
  }, [eventId]);

  const updateSettings = (newSettings: Partial<EventSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <EventSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </EventSettingsContext.Provider>
  );
};

export const useEventSettings = () => {
  const context = useContext(EventSettingsContext);
  if (!context) {
    throw new Error('useEventSettings must be used within an EventSettingsProvider');
  }
  return context;
};
