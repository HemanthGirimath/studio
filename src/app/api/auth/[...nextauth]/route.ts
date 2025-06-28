import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Augment the session to include the accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

// Augment the JWT to include the accessToken
import { type JWT } from 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}


export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
