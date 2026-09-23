import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  try {
    const { id } = await params;

    const { data: feedback, error } = await supabase
      .from('EventFeedback') // Or ExhibitFeedback, if both share the same endpoint this needs adjustment
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!feedback) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Failed to get feedback by ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
