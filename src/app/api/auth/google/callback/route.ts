import { createSession } from '@/lib/session';
import { google } from 'googleapis';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    // Handle error: No code provided
    console.error('No code provided by Google');
    return redirect('/?error=auth_failed');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
        throw new Error("Access token not received from Google");
    }

    await createSession(tokens.access_token);

    return redirect('/');
  } catch (error) {
    console.error('Failed to exchange code for token:', error);
    return redirect('/?error=auth_failed');
  }
}
