"use client";

import React from 'react';
import { Inbox, Send, FileText, BrainCircuit, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from '@/app/actions';

type EmailSidebarProps = {
  category: 'inbox' | 'sent' | 'draft';
  unreadCounts: { inbox: number; sent: number; draft: number };
  setCategory: (category: 'inbox' | 'sent' | 'draft') => void;
};

export function EmailSidebar({ category, unreadCounts, setCategory }: EmailSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">Gmail VoiceFlow</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setCategory('inbox')} isActive={category === 'inbox'} tooltip="Inbox">
              <Inbox />
              <span>Inbox</span>
              {unreadCounts.inbox > 0 && <Badge className="ml-auto">{unreadCounts.inbox}</Badge>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setCategory('sent')} isActive={category === 'sent'} tooltip="Sent" disabled>
              <Send />
              <span>Sent</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setCategory('draft')} isActive={category === 'draft'} tooltip="Drafts" disabled>
              <FileText />
              <span>Drafts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
          <div className="text-xs text-muted-foreground p-2 text-center">
            <p>Use your voice to manage emails.</p>
            <p>Click the mic to start.</p>
          </div>
          <div className="flex items-center justify-between">
            <form action={signOutAction}>
              <Button variant="outline" type="submit" className="w-full">
                <LogOut className="mr-2" /> Sign Out
              </Button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
