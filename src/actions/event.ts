'use server';

import { prisma } from '../lib/prisma';

export async function getEvent(eventId?: string) {
  try {
    let event;
    
    if (eventId) {
      event = await prisma.event.findUnique({
        where: { id: eventId }
      });
    } else {
      // 開発用のフォールバック（最初のイベントを取得）
      event = await prisma.event.findFirst();
    }

    if (!event) {
      // 指定されたイベントがない場合はエラー
      if (eventId) {
        throw new Error('Event not found');
      }

      // 開発用フォールバックで一つもない場合はデフォルトイベントを作成する
      event = await prisma.event.create({
        data: {
          title: 'デフォルトイベント',
          description: 'テスト用の自動生成イベントです',
          startDate: new Date(),
          endDate: new Date(),
          location: 'テスト会場',
          eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
          eventQ3Placeholder: '例：色使いがとても綺麗だったから',
          creatorQ2Placeholder: '例：作品の〇〇の表現から',
          creatorQ3Placeholder: '例：不思議な魅力があったから',
          freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
          freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
          referralSources: 'X(旧Twitter),Instagram,ポスター/チラシ,知人の紹介,その他',
          adminId: 'dummy-admin-id',
        }
      });
    }
    return { data: event, error: null };
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return { data: null, error };
  }
}

export async function getLatestEventId() {
  try {
    const event = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    return { data: event?.id || null, error: null };
  } catch (error) {
    console.error('Failed to fetch latest event id:', error);
    return { data: null, error };
  }
}

export async function getAdminEvents(adminId: string) {
  try {
    const events = await prisma.event.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' }
    });
    return { data: events, error: null };
  } catch (error) {
    console.error('Failed to fetch admin events:', error);
    return { data: null, error };
  }
}

export async function createEvent(data: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  adminId: string;
  eventType: string;
  hasEventSurvey: boolean;
  hasExhibits: boolean;
  exhibitTerm: string;
  exhibitNames?: string[];
}) {
  try {
    const { exhibitNames, ...eventData } = data;
    const newEvent = await prisma.event.create({
      data: {
        ...eventData,
        eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
        eventQ3Placeholder: '例：色使いがとても綺麗だったから',
        creatorQ2Placeholder: '例：作品の〇〇の表現から',
        creatorQ3Placeholder: '例：不思議な魅力があったから',
        freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        referralSources: 'X(旧Twitter),Instagram,ポスター/チラシ,知人の紹介,その他',
        ...(exhibitNames && exhibitNames.length > 0
          ? {
              exhibits: {
                create: exhibitNames.map(name => ({
                  name,
                }))
              }
            }
          : {})
      }
    });
    return { data: newEvent, error: null };
  } catch (error) {
    console.error('Failed to create event:', error);
    return { data: null, error };
  }
}
