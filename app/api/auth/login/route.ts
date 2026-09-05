import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up first.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const sessionData = { id: user.id, email: user.email, name: user.name, role: user.role };
    await createSessionCookie(sessionData);

    return NextResponse.json({ success: true, user: sessionData });
    } catch (err) {
    console.error('Login error:', err);   // or 'Signup error:' in the signup file
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
