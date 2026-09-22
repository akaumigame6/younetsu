import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdmin } from '../../../../../lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, iconUrl, shareToken } = body;

    const creator = await prisma.creator.update({
      where: { id },
      data: { name, description, iconUrl, shareToken }
    });

    return NextResponse.json(creator);
  } catch (error) {
    console.error('Failed to update creator:', error);
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    
    await prisma.creator.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete creator:', error);
    return NextResponse.json({ error: 'Failed to delete creator' }, { status: 500 });
  }
}
