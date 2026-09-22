import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const creator = await prisma.creator.findUnique({
      where: { shareToken },
      include: {
        feedbackRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }
    
    return NextResponse.json(creator);
  } catch (error) {
    console.error('Failed to fetch creator:', error);
    return NextResponse.json({ error: 'Failed to fetch creator' }, { status: 500 });
  }
}
