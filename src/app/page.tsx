import GmailVoiceflow from '@/components/gmail-voiceflow';
import { getSession } from '@/lib/session';

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session?.accessToken;

  return <GmailVoiceflow isAuthenticated={isAuthenticated} />;
}
