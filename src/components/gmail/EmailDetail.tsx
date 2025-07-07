"use client";

import React from 'react';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Email } from '@/app/types';

type EmailDetailProps = {
  email: Email | undefined;
  aiSummary: string | null;
  isLoadingSummary: boolean;
  onSummarize: (email: Email) => void;
  onReadAloud: (email: Email) => void;
};

export function EmailDetail({ email, aiSummary, isLoadingSummary, onSummarize, onReadAloud }: EmailDetailProps) {
  return (
    <main className="bg-red">
      {email ? (
        <>
          {/* Fixed Header */}
          <header className="p-6 border-b shrink-0 bg-red">
            <h2 className="text-3xl font-bold truncate">{email.subject}</h2>
            <div className="flex items-center gap-4 text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{email.from.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{email.from}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <time suppressHydrationWarning>{new Date(email.date).toLocaleString()}</time>
            </div>
          </header>

          {/* Scrollable Body */}
          <div className=" ">
            <div className="p-6 prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed whitespace-pre-wrap font-body">
              {email.body}
            </div>
          </div>

          {/* Fixed Footer */}
          <footer className="">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onReadAloud(email)} className="flex-1 sm:flex-none">
                <User className="mr-2 h-4 w-4" /> Read Aloud
              </Button>
              <Button onClick={() => onSummarize(email)} disabled={isLoadingSummary} className="flex-1 sm:flex-none">
                <Bot className="mr-2 h-4 w-4" /> Summarize with AI
              </Button>
            </div>

            {isLoadingSummary && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}


            {aiSummary && (
              <Alert className="bg-accent/10 border-accent/50">
                <Bot className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent font-bold">AI Summary</AlertTitle>
                <AlertDescription>{aiSummary}</AlertDescription>
              </Alert>
            )}
          </footer>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>Select an email to read</p>
        </div>
      )}
    </main>
  );
}
