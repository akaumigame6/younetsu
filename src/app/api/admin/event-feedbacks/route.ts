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
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let query = supabase.from('EventFeedback').select('*').order('createdAt', { ascending: false });
    if (eventId) {
      query = query.eq('eventId', eventId);
    }

    const { data: eventFeedbacks, error } = await query;
    if (error) throw error;

    return NextResponse.json(eventFeedbacks);
  } catch (error) {
    console.error('Failed to fetch admin event feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch event feedbacks' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isRead } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data: updated, error } = await supabase
      .from('EventFeedback')
      .update({ isRead, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update event feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
