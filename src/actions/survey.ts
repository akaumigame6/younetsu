'use server';

import { createClient } from '../utils/supabase/server';

export async function getExhibits(eventId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('Exhibit')
      .select('*')
      .eq('eventId', eventId)
      .order('createdAt', { ascending: true });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch exhibits:', error);
    return { data: null, error };
  }
}

export async function saveEventFeedback(data: any, existingId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { eventId, customAnswers, userId, ...feedbackData } = data; // Ignore passed userId
    const id = existingId || crypto.randomUUID();
    
    if (existingId) {
      const { data: updatedFeedback, error } = await supabase
        .from('EventFeedback')
        .update({
          ...feedbackData,
          q1: feedbackData.q1 || [],
          referralSources: feedbackData.referralSources || [],
          customAnswers: customAnswers || {},
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingId)
        .select()
        .single();
        
      if (error) throw error;
      return { data: updatedFeedback, error: null };
    } else {
      const { data: newFeedback, error } = await supabase
        .from('EventFeedback')
        .insert({
          id,
          eventId,
          userId: user.id,
          ...feedbackData,
          q1: feedbackData.q1 || [],
          referralSources: feedbackData.referralSources || [],
          customAnswers: customAnswers || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return { data: newFeedback, error: null };
    }
  } catch (error: any) {
    console.error('Failed to submit event feedback:', error);
    return { data: null, error: error?.message || 'Failed to submit' };
  }
}

export async function getExistingEventFeedback(userId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('EventFeedback')
      .select('*')
      .eq('userId', userId)
      .eq('eventId', eventId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function saveExhibitFeedback(data: any, existingId?: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const id = existingId || crypto.randomUUID(); 
    
    if (existingId) {
      const { data: updatedFeedback, error } = await supabase
        .from('ExhibitFeedback')
        .update({
          inputType: data.inputType,
          content: data.content || '',
          q1: data.q1 || [],
          q2: data.q2 || '',
          q3: data.q3 || '',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingId)
        .select()
        .single();
        
      if (error) throw error;
      return { data: updatedFeedback, error: null };
    } else {
      const { data: newFeedback, error } = await supabase
        .from('ExhibitFeedback')
        .insert({
          id,
          exhibitId: data.exhibitId,
          userId: user.id, // Use secure auth user id
          inputType: data.inputType,
          content: data.content || '',
          q1: data.q1 || [],
          q2: data.q2 || '',
          q3: data.q3 || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return { data: newFeedback, error: null };
    }
  } catch (error: any) {
    console.error('Failed to submit exhibit feedback:', error);
    return { data: null, error: error?.message || 'Failed to submit' };
  }
}

export async function getExistingExhibitFeedback(userId: string, exhibitId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ExhibitFeedback')
      .select('*')
      .eq('userId', userId)
      .eq('exhibitId', exhibitId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEventFeedbacks(eventId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('EventFeedback')
      .select('*')
      .eq('eventId', eventId)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch event feedbacks:', error);
    return { data: null, error };
  }
}

export async function getExhibitFeedbacks(eventId: string) {
  try {
    const supabase = await createClient();
    // Exhibit と JOIN してイベントIDで絞り込む
    const { data, error } = await supabase
      .from('ExhibitFeedback')
      .select('*, Exhibit!inner(*)')
      .eq('Exhibit.eventId', eventId)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    const mapped = data.map((f: any) => ({
      ...f,
      exhibit: f.Exhibit || f.exhibit
    }));
    
    return { data: mapped, error: null };
  } catch (error) {
    console.error('Failed to fetch exhibit feedbacks:', error);
    return { data: null, error };
  }
}

export async function updateEventFeedbackStatus(id: string, isRead: boolean) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('EventFeedback')
      .update({ isRead, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to update event feedback status:', error);
    return { data: null, error };
  }
}

export async function updateExhibitFeedbackStatus(id: string, isRead: boolean) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ExhibitFeedback')
      .update({ isRead, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to update exhibit feedback status:', error);
    return { data: null, error };
  }
}

export async function getEventFeedbacksByViewer(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('EventFeedback')
      .select('*, Event(*)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    const mapped = data.map((f: any) => ({
      ...f,
      event: f.Event || f.event
    }));
    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getExhibitFeedbacksByViewer(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ExhibitFeedback')
      .select('*, Exhibit!inner(*)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    
    const mapped = data.map((f: any) => ({
      ...f,
      exhibit: f.Exhibit || f.exhibit
    }));
    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEventFeedbackById(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('EventFeedback')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getExhibitFeedbackById(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ExhibitFeedback')
      .select('*, Exhibit(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const mapped = {
      ...data,
      exhibit: data.Exhibit || data.exhibit
    };
    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
