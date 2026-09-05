import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const [campaigns, recentTransactions, totalRaisedAgg, totalWithdrawnAgg, userCount] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, phone: true } } },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { campaign: { select: { title: true } } },
      }),
      prisma.transaction.aggregate({
        where: { type: 'DONATION', status: 'SUCCESSFUL' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: { in: ['PENDING', 'SUCCESSFUL'] } },
        _sum: { amount: true },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      success: true,
      totals: {
        totalRaised: totalRaisedAgg._sum.amount || 0,
        totalWithdrawn: totalWithdrawnAgg._sum.amount || 0,
        totalUsers: userCount,
        totalCampaigns: campaigns.length,
      },
      campaigns,
      recentTransactions,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return NextResponse.json({ error: 'Failed to load admin overview.' }, { status: 500 });
  }
}
