import GmailVoiceflow from '@/components/gmail-voiceflow';
import { getSession } from '@/lib/session';
import { google } from 'googleapis';

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session?.accessToken;

  let authorizationUrl = '';
  if (!isAuthenticated) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_URL } = process.env;

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && AUTH_URL) {
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

      authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true,
      });
    } else {
        console.error('Missing Google OAuth environment variables. Cannot generate sign-in link.');
    }
  }

  return <GmailVoiceflow isAuthenticated={isAuthenticated} authorizationUrl={authorizationUrl} />;
}
