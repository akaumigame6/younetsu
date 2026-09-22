import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const surveys = await prisma.surveyRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Failed to fetch admin surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}
