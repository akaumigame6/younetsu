import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET() {
  try {
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
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
    return NextResponse.json(creators);
  } catch (error) {
    console.error('Failed to fetch creators:', error);
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
  }
}
