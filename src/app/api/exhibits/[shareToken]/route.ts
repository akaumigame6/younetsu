import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ shareToken: string }> }) {
  // Use admin client to bypass RLS since this endpoint authenticates via shareToken
  const supabase = await createAdminClient();
  try {
    const { shareToken } = await params;

    const { data: exhibit, error } = await supabase
      .from('Exhibit')
      .select('id, eventId, name, description, iconUrl, shareToken, createdAt, Event(id, title, useReadStatus), ExhibitFeedback(id, inputType, content, q1, q2, q3, isRead, createdAt)')
      .eq('shareToken', shareToken)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!exhibit) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Map objects to expected properties
    const mapped = {
      ...exhibit,
      event: exhibit.Event || exhibit.event,
      feedbackRecords: exhibit.ExhibitFeedback || exhibit.feedbackRecords || []
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to get exhibit by shareToken:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
