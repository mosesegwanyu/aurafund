import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({ campaigns });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load campaigns.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { title, targetAmount, description } = await req.json();

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        targetAmount: Number(targetAmount),
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
  }
}
