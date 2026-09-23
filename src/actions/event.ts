'use server';

import { createClient } from '../utils/supabase/server';

export async function getEvent(eventId?: string) {
  try {
    const supabase = await createClient();
    let event = null;
    
    if (eventId) {
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      event = data;
    } else {
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .order('createdAt', { ascending: true })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      event = data;
    }

    if (!event) {
      if (eventId) {
        throw new Error('Event not found');
      }

      const { data: newEvent, error } = await supabase
        .from('Event')
        .insert({
          id: crypto.randomUUID(),
          title: 'デフォルトイベント',
          description: 'テスト用の自動生成イベントです',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          location: 'テスト会場',
          eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
          eventQ3Placeholder: '例：色使いがとても綺麗だったから',
          creatorQ2Placeholder: '例：作品の〇〇の表現から',
          creatorQ3Placeholder: '例：不思議な魅力があったから',
          freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
          freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
          referralSources: ['X(旧Twitter)', 'Instagram', 'ポスター/チラシ', '知人の紹介', 'その他'],
          userId: 'dummy-admin-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      event = newEvent;
    }
    
    return { data: event, error: null };
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return { data: null, error };
  }
}

export async function getLatestEventId() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('Event')
      .select('id')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return { data: data?.id || null, error: null };
  } catch (error) {
    console.error('Failed to fetch latest event id:', error);
    return { data: null, error };
  }
}

export async function getAdminEvents(userId?: string) { // Parameter kept for backward compatibility but ignored
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('Event')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch admin events:', error);
    return { data: null, error };
  }
}

export async function createEvent(data: {
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  userId?: string; // Parameter kept for backward compatibility but ignored
  eventType: string;
  hasEventSurvey: boolean;
  hasExhibits: boolean;
  exhibitTerm: string;
  exhibitNames?: string[];
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { exhibitNames, startDate, endDate, eventType, ...eventData } = data;
    
    // Ignore passed userId and use secure auth user id
    delete eventData.userId;
    
    const { data: newEvent, error: eventError } = await supabase
      .from('Event')
      .insert({
        id: crypto.randomUUID(),
        ...eventData,
        userId: user.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
        eventQ3Placeholder: '例：色使いがとても綺麗だったから',
        creatorQ2Placeholder: '例：作品の〇〇の表現から',
        creatorQ3Placeholder: '例：不思議な魅力があったから',
        freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        referralSources: ['X(旧Twitter)', 'Instagram', 'ポスター/チラシ', '知人の紹介', 'その他'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (eventError) throw eventError;

    if (exhibitNames && exhibitNames.length > 0) {
      const exhibitsToInsert = exhibitNames.map(name => ({
        id: crypto.randomUUID(),
        eventId: newEvent.id,
        name,
        shareToken: crypto.randomUUID(), // shareToken を追加
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      const { error: exhibitsError } = await supabase
        .from('Exhibit')
        .insert(exhibitsToInsert);
        
      if (exhibitsError) throw exhibitsError;
    }

    return { data: newEvent, error: null };
  } catch (error: any) {
    console.error('Failed to create event:', error);
    return { data: null, error: error?.message || 'Failed to create event' };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('Event')
      .delete()
      .eq('id', eventId)
      .eq('userId', user.id);

    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    return { success: false, error: error?.message || 'Failed to delete event' };
  }
}
