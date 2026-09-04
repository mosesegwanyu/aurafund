import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  }
  console.warn(
    'JWT_SECRET is not set. Using an insecure development-only fallback — set JWT_SECRET in your .env file.'
  );
}

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production'
);

export async function createSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = cookies();
  cookieStore.set('user_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('user_session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { id: string; email: string; name: string; role: string };
  } catch (err) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.set('user_session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}
