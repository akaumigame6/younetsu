'use server';

import { createClient } from '../utils/supabase/server';

export interface StartLogParams {
  eventId: string;
  targetType: 'event' | 'exhibit';
  targetId: string;
}

export interface SubmitLogParams {
  eventId: string;
  sessionCount: number;
  targetType: 'event' | 'exhibit';
  targetId: string;
  feedbackId: string;
  inputMethod: 'ai' | 'template' | 'free' | null;
  isEdited: boolean | null;
}

/**
 * 来場者の投稿フロー開始ログを記録し、採番された利用回数 (sessionCount) を返す
 * イベント（eventId）ごとに利用回数を独立してカウントします。
 */
export async function recordVisitorLogStart({ eventId, targetType, targetId }: StartLogParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('Anonymous user not authenticated yet during log start');
      return { sessionCount: 1, error: 'Unauthorized' };
    }

    // 該当イベント内でのこれまでの最大 sessionCount を取得
    const { data: latestLog, error: fetchError } = await supabase
      .from('VisitorLog')
      .select('sessionCount')
      .eq('userId', user.id)
      .eq('eventId', eventId)
      .order('sessionCount', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Failed to fetch latest sessionCount:', fetchError);
    }

    const currentMax = latestLog?.sessionCount ?? 0;
    const newSessionCount = currentMax + 1;

    // 開始ログを INSERT
    const { error: insertError } = await supabase
      .from('VisitorLog')
      .insert({
        id: crypto.randomUUID(),
        eventId,
        userId: user.id,
        sessionCount: newSessionCount,
        targetType,
        targetId,
        action: 'start',
        createdAt: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert start log:', insertError);
      return { sessionCount: newSessionCount, error: insertError.message };
    }

    return { sessionCount: newSessionCount, error: null };
  } catch (error: any) {
    console.error('Unexpected error in recordVisitorLogStart:', error);
    return { sessionCount: 1, error: error?.message || 'Failed to record start log' };
  }
}

/**
 * 来場者の投稿完了ログを記録する (上書きせず新規INSERT)
 */
export async function recordVisitorLogSubmit(params: SubmitLogParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { error: insertError } = await supabase
      .from('VisitorLog')
      .insert({
        id: crypto.randomUUID(),
        eventId: params.eventId,
        userId: user.id,
        sessionCount: params.sessionCount,
        targetType: params.targetType,
        targetId: params.targetId,
        feedbackId: params.feedbackId,
        inputMethod: params.inputMethod,
        action: 'submit',
        isEdited: params.isEdited,
        createdAt: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert submit log:', insertError);
      return { error: insertError.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Unexpected error in recordVisitorLogSubmit:', error);
    return { error: error?.message || 'Failed to record submit log' };
  }
}
