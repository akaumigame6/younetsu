import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定
export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const eventFeedbacks = await prisma.eventFeedback.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(eventFeedbacks);
  } catch (error) {
    console.error('Failed to fetch admin event feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch event feedbacks' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, isRead } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updated = await prisma.eventFeedback.update({
      where: { id },
      data: { isRead }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update event feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
