import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

interface SessionPayload extends JWTPayload {
  accessToken: string;
}

const secretKey = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Token valid for 1 hour
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is expired or invalid
    console.error('Failed to verify session token:', error);
    return null;
  }
}

export async function createSession(accessToken: string) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const session = await encrypt({ accessToken, exp: expires.getTime() / 1000 });

  cookies().set('session', session, { expires, httpOnly: true });
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}
