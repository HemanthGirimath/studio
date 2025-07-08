'use server';

import type { Email } from '@/app/types';
import { getSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { summarizeEmail } from '@/ai/flows/summarize-email';
import { contextualResponse } from '@/ai/flows/contextual-responses';

// Helper to decode base64url
function base64UrlDecode(data: string) {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
}

// Helper to parse the from header
function getHeader(headers: any[], name: string): string {
    const header = headers.find((h) => h.name === name);
    // Decode RFC 2047 encoded strings
    if (header?.value) {
        try {
            return header.value.replace(/\?=/g, '?=\n').split('\n').map((part: string) => {
                if (!part.startsWith('=?') || !part.endsWith('?=')) return part;
                try {
                    const match = part.match(/=\?([^?]+)\?([QB])\?([^?]+)\?=/i);
                    if (!match) return part;

                    const [, charset, encoding, encodedText] = match;
                    if (encoding.toUpperCase() === 'B') {
                        return Buffer.from(encodedText, 'base64').toString(charset as BufferEncoding);
                    }
                    if (encoding.toUpperCase() === 'Q') {
                         return encodedText.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/g, (_: any, hex: string) => String.fromCharCode(parseInt(hex, 16)));
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

export async function fetchEmails(): Promise<{ emails?: Email[], error?: string }> {
    const session = await getSession();
    if (!session?.accessToken) {
        console.log("No access token found in session.");
        return { error: 'unauthorized' };
    }
    const accessToken = session.accessToken;
    const headers = { Authorization: `Bearer ${accessToken}` };
    
    try {
        // 1. Get list of message IDs
        const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=in:inbox%20newer_than:1d', { headers });

        if (!listResponse.ok) {
            const errorData = await listResponse.json();
            console.error('Failed to fetch email list:', listResponse.status, errorData);
            if (listResponse.status === 401) {
                // Token likely expired, clear session and signal client to redirect
                (await
                    // Token likely expired, clear session and signal client to redirect
                    cookies()).delete('session');
                return { error: 'unauthorized' };
            }
            return { error: 'fetch_failed' };
        }
        const listData = await listResponse.json();
        const messages = listData.messages || [];

        if (!messages.length) {
            console.log('No new messages found.');
            return { emails: [] };
        }

        // 2. Fetch each message
        const emailPromises = messages.map(async (message: { id: string }) => {
            if (!message.id) return null;
            const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`, { headers });
            
            if (!msgResponse.ok) {
                console.error(`Failed to fetch email ${message.id}:`, msgResponse.status);
                return null;
            }
            const msgData: any = await msgResponse.json();

            // 3. Parse the message data
            const { payload, id, internalDate } = msgData;
            if (!payload?.headers || !id || !internalDate) return null;

            const msgHeaders = payload.headers;
            const from = getHeader(msgHeaders, 'From');
            const to = getHeader(msgHeaders, 'To');
            const subject = getHeader(msgHeaders, 'Subject');
            const isRead = !(msgData.labelIds?.includes('UNREAD'));

            let body = '';
            if (payload.parts) {
                const part = payload.parts.find((p: { mimeType: string; }) => p.mimeType === 'text/plain');
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
           date: new Date(parseInt(internalDate, 10)).toString(),
                category: 'inbox' as const,
                read: isRead,
            };
        }); 

        const emails = (await Promise.all(emailPromises)).filter(Boolean) as Email[];
        return { emails: emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    } catch (error) {
        console.error('An error occurred in fetchEmails:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }
        return { error: 'unknown' };
    }
}

export async function signOutAction() {
    (await cookies()).delete('session');
    redirect('/');
}

export async function summarizeEmailAction(emailContent: string) {
    return await summarizeEmail({ emailContent });
}

export async function contextualResponseAction(query: string, context: string) {
    return await contextualResponse({ query, context });
}
