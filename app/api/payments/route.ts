import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, amount, phone, donorName, campaignId, name } = await req.json();
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: 'Server key unconfigured' }, { status: 500 });
    }

    if (action === 'donate') {
      const res = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: `DON-${Date.now()}`,
          amount: Number(amount),
          currency: 'UGX',
          email: 'payments@aurafund.app',
          phone_number: phone,
          redirect_url: 'https://aurafund.vercel.app/api/callback',
          meta: { campaignId, donorName },
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'withdraw') {
      const res = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: 'MPS',
          account_number: phone,
          amount: Number(amount),
          narration: 'AuraFund Campaign Payout',
          currency: 'UGX',
          reference: `WDR-${Date.now()}`,
          beneficiary_name: name || 'Campaign Creator',
          destination_branch_code: 'UG280103',
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
