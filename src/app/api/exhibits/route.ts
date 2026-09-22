import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    const exhibits = await prisma.exhibit.findMany({
      where: eventId ? { eventId } : undefined,
      select: {
        id: true,
        eventId: true,
        name: true,
        description: true,
        iconUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(exhibits);
  } catch (error) {
    console.error('Failed to fetch exhibits:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibits' }, { status: 500 });
  }
}
