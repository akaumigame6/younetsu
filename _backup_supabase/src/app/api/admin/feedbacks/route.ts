import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    const feedbacks = await prisma.feedbackRecord.findMany({
      where: creatorId ? { creatorId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true
      }
    });
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Failed to fetch admin feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }
}
