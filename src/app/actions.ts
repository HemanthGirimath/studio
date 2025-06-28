'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';

export type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  category: 'inbox' | 'sent' | 'draft';
  read: boolean;
};


// Helper to decode base64url
function base64UrlDecode(data: string) {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
}

// Helper to parse the from header
function getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string {
    const header = headers.find((h) => h.name === name);
    // Decode RFC 2047 encoded strings
    if (header?.value) {
        try {
            return header.value.replace(/\?=/g, '?=\n').split('\n').map(part => {
                if (!part.startsWith('=?') || !part.endsWith('?=')) return part;
                try {
                    const [,, charset, encoding, encodedText] = part.match(/=\?([^?]+)\?([QB])\?([^?]+)\?=/i) || [];
                    if (encoding.toUpperCase() === 'B') {
                        return Buffer.from(encodedText, 'base64').toString(charset.toLowerCase());
                    }
                    if (encoding.toUpperCase() === 'Q') {
                         return encodedText.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                    }
                    return part; // fallback
                } catch {
                    return part;
                }
            }).join('');
        } catch {
            return header.value;
        }
    }
    return '';
}

export async function fetchEmails(): Promise<Email[]> {
    const session = await auth();
    if (!session?.accessToken) {
        console.log("No access token found in session.");
        return [];
    }

    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    try {
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 30,
            q: 'in:inbox newer_than:1d'
        });

        const messages = response.data.messages || [];
        if (!messages.length) {
            console.log('No new messages found.');
            return [];
        }

        const emailPromises = messages.map(async (message) => {
            if (!message.id) return null;
            const msgResponse = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full'
            });

            const { payload, id, internalDate } = msgResponse.data;
            if (!payload?.headers || !id || !internalDate) return null;

            const headers = payload.headers;
            const from = getHeader(headers, 'From');
            const to = getHeader(headers, 'To');
            const subject = getHeader(headers, 'Subject');
            const isRead = !(msgResponse.data.labelIds?.includes('UNREAD'));

            let body = '';
            if (payload.parts) {
                const part = payload.parts.find(p => p.mimeType === 'text/plain');
                if (part?.body?.data) {
                    body = base64UrlDecode(part.body.data);
                }
            } else if (payload.body?.data) {
                body = base64UrlDecode(payload.body.data);
            }

            return {
                id,
                from,
                to,
                subject,
                body,
                date: new Date(parseInt(internalDate, 10)).toISOString(),
                category: 'inbox' as const,
                read: isRead,
            };
        });

        const emails = (await Promise.all(emailPromises)).filter(Boolean) as Email[];
        return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error('Failed to fetch emails:', error);
        return [];
    }
}
