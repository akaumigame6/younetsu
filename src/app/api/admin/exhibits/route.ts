import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    const exhibits = await prisma.exhibit.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(exhibits);
  } catch (error) {
    console.error('Failed to fetch admin exhibits:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { eventId, name, description, iconUrl, shareToken } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const exhibit = await prisma.exhibit.create({
      data: {
        eventId,
        name,
        description,
        iconUrl,
        shareToken,
      }
    });

    return NextResponse.json(exhibit, { status: 201 });
  } catch (error) {
    console.error('Failed to create exhibit:', error);
    return NextResponse.json({ error: 'Failed to create exhibit' }, { status: 500 });
  }
}
