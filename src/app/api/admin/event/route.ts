import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const revalidate = 0; // サーバサイドのキャッシュを無効化

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event settings:', error);
    return NextResponse.json({ error: 'Failed to update event settings' }, { status: 500 });
  }
}
