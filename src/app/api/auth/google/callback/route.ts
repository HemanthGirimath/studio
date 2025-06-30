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
    return redirect('/?error=auth_failed_no_code');
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !AUTH_URL) {
    throw new Error('Missing Google OAuth environment variables. Please check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_URL in your .env file.');
  }

  const redirectURI = `${AUTH_URL}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectURI
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
    return redirect('/?error=auth_failed_token_exchange');
  }
}
