import { google } from 'googleapis';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
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

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  });

  return redirect(authorizationUrl);
}
