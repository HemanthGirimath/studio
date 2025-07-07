"use client";

import React from 'react';
import { BrainCircuit, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LoginViewProps = {
  authorizationUrl: string;
  handleSignIn: () => void;
  authError: string | null;
};

export function LoginView({ authorizationUrl, handleSignIn, authError }: LoginViewProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <BrainCircuit className="h-12 w-12 text-primary" />
      <h1 className="text-3xl font-bold">Gmail VoiceFlow</h1>
      <p className="text-muted-foreground">Sign in with your Google account to continue</p>
      {authorizationUrl ? (
        <Button onClick={handleSignIn} className="flex items-center gap-2">
          <LogIn className="h-4 w-4" /> Sign in with Google
        </Button>
      ) : (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Could not generate Google sign-in link. Please check server logs or ensure environment variables are set.
          </AlertDescription>
        </Alert>
      )}
      {authError && <div style={{ color: 'red' }}>{authError}</div>}
    </div>
  );
}
