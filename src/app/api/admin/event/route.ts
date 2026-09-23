import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export const revalidate = 0;

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: events, error } = await supabase
      .from('Event')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch admin events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { id, ...updateData } = payload;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    // まずイベントが存在するか、userId が何になっているか確認
    const { data: existingEvent, error: fetchError } = await supabase
      .from('Event')
      .select('id, userId')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: `IDが ${id} のイベントが存在しません。` }, { status: 404 });
    }

    if (existingEvent.userId !== user.id) {
      return NextResponse.json({ 
        error: `権限エラー: イベント作成者(${existingEvent.userId})と現在のユーザー(${user.id})が一致しません。` 
      }, { status: 403 });
    }

    // クリーンアップ（undefinedのプロパティを削除）
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('Event')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('userId', user.id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '更新処理に失敗しました。' }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update event' }, { status: 500 });
  }
}
