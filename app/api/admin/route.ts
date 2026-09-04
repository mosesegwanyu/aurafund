import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 });
  }

  // STRICT CHECK: Reject non-admin sessions immediately
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  return NextResponse.json({ success: true, message: 'Welcome to Administrator Backoffice', admin: session });
}
