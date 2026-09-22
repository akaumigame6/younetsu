import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const exhibit = await prisma.exhibit.findUnique({
      where: { shareToken },
      include: {
        feedbackRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!exhibit) {
      return NextResponse.json({ error: 'Exhibit not found' }, { status: 404 });
    }
    
    return NextResponse.json(exhibit);
  } catch (error) {
    console.error('Failed to fetch exhibit:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibit' }, { status: 500 });
  }
}
