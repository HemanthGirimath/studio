import { createSession } from '@/lib/session';
import { google } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    // Handle error: No code provided
    console.error('No code provided by Google');
    return NextResponse.json({ error: 'Authentication failed: No code provided.' }, { status: 400 });
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

    const responseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <script>
            window.close();
          </script>
        </head>
        <body>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `;
    
    return new NextResponse(responseHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Failed to exchange code for token:', error);
     const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Sorry, we were unable to sign you in. Please try again.</p>
          <p>Error: ${error instanceof Error ? error.message : "Unknown error"}</p>
        </body>
      </html>
    `;
     return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
