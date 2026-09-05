import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Flutterwave sends a `verif-hash` header matching a secret hash you set
// yourself in the Flutterwave dashboard (Settings → Webhooks). This proves
// the request really came from Flutterwave and not an impersonator.
export async function POST(req: Request) {
  try {
    const signature = req.headers.get('verif-hash');
    const expectedSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

    if (!expectedSecret) {
      console.error('FLUTTERWAVE_WEBHOOK_SECRET_HASH is not set — rejecting webhook.');
      return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
    }

    if (!signature || signature !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const payload = await req.json();
    const data = payload?.data;
    const reference: string | undefined = data?.tx_ref || data?.reference;
    const flutterwaveStatus: string | undefined = data?.status;

    if (!reference) {
      return NextResponse.json({ error: 'Missing transaction reference.' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { reference } });
    if (!transaction) {
      console.error('Webhook referenced unknown transaction:', reference);
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    // Already handled — Flutterwave can send the same webhook more than
    // once, so don't double-credit a campaign.
    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ success: true, note: 'Already processed.' });
    }

    const isSuccessful = flutterwaveStatus === 'successful' || flutterwaveStatus === 'completed';
    const newStatus = isSuccessful ? 'SUCCESSFUL' : 'FAILED';

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: newStatus, rawPayload: JSON.stringify(payload) },
      });

      if (transaction.type === 'DONATION' && isSuccessful) {
        await tx.campaign.update({
          where: { id: transaction.campaignId },
          data: { raisedAmount: { increment: transaction.amount } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Flutterwave webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
