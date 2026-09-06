import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const FLUTTERWAVE_BASE = 'https://api.flutterwave.com/v3';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, amount, phone, campaignId, donorName } = body;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 500 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a valid positive number.' }, { status: 400 });
    }

    // ── Anyone can donate — no login required ──────────────────────────────
    if (action === 'donate') {
      if (!campaignId || !phone) {
        return NextResponse.json({ error: 'campaignId and phone are required.' }, { status: 400 });
      }

      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
      }

      const txRef = `DON-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // Record the attempt immediately, as PENDING. raisedAmount is NOT
      // touched here — only the webhook, once Flutterwave confirms the
      // charge actually succeeded, is allowed to update it.
      await prisma.transaction.create({
        data: {
          type: 'DONATION',
          status: 'PENDING',
          amount: numericAmount,
          reference: txRef,
          phone,
          donorName: donorName || null,
          campaignId,
        },
      });

      const res = await fetch(`${FLUTTERWAVE_BASE}/charges?type=mobile_money_uganda`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: numericAmount,
          currency: 'UGX',
          email: 'donor@aurafund.app',
          phone_number: phone,
          meta: { campaignId, donorName },
        }),
      });

      const data = await res.json();
      console.log('Flutterwave charge response:', JSON.stringify(data));

      if (!res.ok || data.status === 'error') {
        console.error('Flutterwave charge rejected:', data);
        await prisma.transaction.update({
          where: { reference: txRef },
          data: { status: 'FAILED', rawPayload: JSON.stringify(data) },
        });
        return NextResponse.json(
          { error: data.message || 'Payment provider rejected this donation.' },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data, txRef });
    }

    // ── Withdrawals require login + ownership (or admin) ────────────────────
    if (action === 'withdraw') {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
      }

      if (!campaignId) {
        return NextResponse.json({ error: 'campaignId is required.' }, { status: 400 });
      }

      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
      }

      if (campaign.userId !== session.id && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'You do not have permission to withdraw from this campaign.' }, { status: 403 });
      }

      const momoNumber = body.momoNumber || phone;
      if (!momoNumber) {
        return NextResponse.json({ error: 'A mobile money number is required.' }, { status: 400 });
      }

      // Work out what's actually available: confirmed donations minus
      // everything already paid out or currently in flight.
      const [donatedAgg, withdrawnAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: { campaignId, type: 'DONATION', status: 'SUCCESSFUL' },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { campaignId, type: 'WITHDRAWAL', status: { in: ['PENDING', 'SUCCESSFUL'] } },
          _sum: { amount: true },
        }),
      ]);

      const available = (donatedAgg._sum.amount || 0) - (withdrawnAgg._sum.amount || 0);

      if (numericAmount > available) {
        return NextResponse.json(
          { error: `Insufficient balance. Available to withdraw: UGX ${available.toLocaleString()}.` },
          { status: 400 }
        );
      }

      const transferRef = `WDR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      await prisma.transaction.create({
        data: {
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: numericAmount,
          reference: transferRef,
          phone: momoNumber,
          campaignId,
        },
      });

      const res = await fetch(`${FLUTTERWAVE_BASE}/transfers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: 'MPS',
          account_number: momoNumber,
          amount: numericAmount,
          narration: 'AuraFund Payout',
          currency: 'UGX',
          reference: transferRef,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        console.error('Flutterwave transfer rejected:', data);
        await prisma.transaction.update({
          where: { reference: transferRef },
          data: { status:
