import { NextResponse } from 'next/server';
import { createClient } from '../../../../../utils/supabase/server';

export const revalidate = 0;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const updateData = await request.json();

    const { data: updatedExhibit, error } = await supabase
      .from('Exhibit')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedExhibit);
  } catch (error) {
    console.error('Failed to update exhibit:', error);
    return NextResponse.json({ error: 'Failed to update exhibit' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { error } = await supabase
      .from('Exhibit')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exhibit:', error);
    return NextResponse.json({ error: 'Failed to delete exhibit' }, { status: 500 });
  }
}
