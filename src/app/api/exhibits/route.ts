import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let query = supabase.from('Exhibit').select('id, eventId, name, description, iconUrl, createdAt');
    if (eventId) {
      query = query.eq('eventId', eventId);
    }

    const { data: exhibits, error } = await query;
    if (error) throw error;

    return NextResponse.json(exhibits);
  } catch (error) {
    console.error('Failed to get exhibits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
