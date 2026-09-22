import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定
export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const exhibitId = searchParams.get('exhibitId');
    const eventId = searchParams.get('eventId'); // 必要に応じて

    const feedbacks = await prisma.exhibitFeedback.findMany({
      where: {
        ...(exhibitId ? { exhibitId } : {}),
        ...(eventId ? { exhibit: { eventId } } : {}) // eventIdで絞り込む場合
      },
      orderBy: { createdAt: 'desc' },
      include: {
        exhibit: true
      }
    });
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Failed to fetch admin exhibit feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibit feedbacks' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, isRead } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updated = await prisma.exhibitFeedback.update({
      where: { id },
      data: { isRead }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update exhibit feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
