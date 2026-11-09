import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '../../../../utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  try {
    const { id } = await params;

    const { data: feedback, error } = await supabase
      .from('ExhibitFeedback')
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createAdminClient();
  try {
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    const { data: feedback, error } = await supabase
      .from('ExhibitFeedback')
      .update({ isRead: Boolean(isRead), updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
