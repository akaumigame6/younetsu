import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const creators = await prisma.creator.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(creators);
  } catch (error) {
    console.error('Failed to fetch admin creators:', error);
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, description, iconUrl, shareToken } = body;

    const creator = await prisma.creator.create({
      data: {
        name,
        description,
        iconUrl,
        shareToken,
      }
    });

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    console.error('Failed to create creator:', error);
    return NextResponse.json({ error: 'Failed to create creator' }, { status: 500 });
  }
}
