import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // セキュリティ: 更新可能フィールドを isRead / reaction のみに制限
    // content, q1, q2, q3 等の改ざんを防止する
    const updateData: Record<string, unknown> = {};
    if (body.isRead !== undefined) updateData.isRead = body.isRead;
    if (body.reaction !== undefined) updateData.reaction = body.reaction;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const feedback = await prisma.feedbackRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
