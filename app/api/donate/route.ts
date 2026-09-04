import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, amount, phone, campaignId, donorName, momoNumber } = await req.json();
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: 'Secret Key missing' }, { status: 500 });
    }

    // USER 3 (GUEST DONOR): Trigger Mobile Money USSD Push Prompt directly to phone
    if (action === 'donate') {
      const txRef = `DON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const res = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: Number(amount),
          currency: 'UGX',
          email: 'donor@aurafund.app',
          phone_number: phone,
          meta: { campaignId, donorName },
        }),
      });

      const data = await res.json();
      return NextResponse.json({ success: true, data, txRef });
    }

    // USER 2 (CAMPAIGN CREATOR): Request withdrawal to their registered MoMo number
    if (action === 'withdraw') {
      const transferRef = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const res = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: 'MPS',
          account_number: momoNumber,
          amount: Number(amount),
          narration: 'AuraFund Payout',
          currency: 'UGX',
          reference: transferRef,
        }),
      });

      const data = await res.json();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server payment failed' }, { status: 500 });
  }
}
