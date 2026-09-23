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
    
    let query = supabase.from('Exhibit').select('*').order('createdAt', { ascending: false });
    if (eventId) {
      query = query.eq('eventId', eventId);
    }

    const { data: exhibits, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(exhibits);
  } catch (error) {
    console.error('Failed to fetch admin exhibits:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId, name, description, iconUrl, shareToken } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const { data: exhibit, error } = await supabase
      .from('Exhibit')
      .insert({
        id: crypto.randomUUID(),
        eventId,
        name,
        description,
        iconUrl,
        shareToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(exhibit, { status: 201 });
  } catch (error) {
    console.error('Failed to create exhibit:', error);
    return NextResponse.json({ error: 'Failed to create exhibit' }, { status: 500 });
  }
}
