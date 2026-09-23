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

    let query = supabase
      .from('ExhibitFeedback')
      .select('*, Exhibit!inner(*)') // join exhibit table
      .order('createdAt', { ascending: false });

    if (eventId) {
      query = query.eq('Exhibit.eventId', eventId);
    }

    const { data: exhibitFeedbacks, error } = await query;
    if (error) throw error;

    // Map Exhibit object to exhibit property as prisma did
    const mapped = exhibitFeedbacks.map((f: any) => ({
      ...f,
      exhibit: f.Exhibit || f.exhibit
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch admin exhibit feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibit feedbacks' }, { status: 500 });
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
      .from('ExhibitFeedback')
      .update({ isRead, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update exhibit feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
