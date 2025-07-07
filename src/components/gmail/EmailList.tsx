"use client";

import React from 'react';
import { MailWarning } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Email } from '@/app/types';

type EmailListProps = {
  emails: Email[];
  selectedEmailId: string | null;
  isLoading: boolean;
  onSelectEmail: (id: string) => void;
  category: string;
};

export function EmailList({ emails, selectedEmailId, isLoading, onSelectEmail, category }: EmailListProps) {
  return (
    <aside className="w-full max-w-sm border-r h-full flex flex-col bg-red">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold capitalize">{category}</h2>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : emails.length > 0 ? (
          <div className="flex flex-col gap-2 p-2">
            {emails.map((email) => (
              <Card
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md',
                  selectedEmailId === email.id ? 'border-primary bg-primary/5' : 'bg-card'
                )}
              >
                <CardHeader className="p-4 ">
                  <div className="flex items-center gap-3 ">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>{email.from.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {!email.read && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate">{email.from}</p>
                      <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                    </div>
                    <time suppressHydrationWarning className="text-xs text-muted-foreground self-start">
                      {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <MailWarning className="h-10 w-10 mb-2" />
            <p className="font-semibold">No emails found</p>
            <p className="text-sm">No new emails in the last day.</p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
