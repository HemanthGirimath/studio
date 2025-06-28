"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Inbox, Send, FileText, Bot, User, BrainCircuit } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceButton } from "@/components/voice-button";
import { useSpeech } from "@/hooks/use-speech";
import { type Email, emails as initialEmails } from "@/lib/data";
import { summarizeEmail } from "@/ai/flows/summarize-email";
import { contextualResponse } from "@/ai/flows/contextual-responses";
import { cn } from "@/lib/utils";

type EmailCategory = "inbox" | "sent" | "draft";

export default function GmailVoiceflow() {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [category, setCategory] = useState<EmailCategory>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(emails.find(e => e.category === 'inbox')?.id || null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [conversationContext, setConversationContext] = useState("");
  const { transcript, isListening, startListening, stopListening, speak, setTranscript, cancelSpeech } = useSpeech();

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const selectedEmail = useMemo(() => emails.find((email) => email.id === selectedEmailId), [emails, selectedEmailId]);

  const handleSummarize = useCallback(async (email: Email) => {
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      speak("Summarizing the email for you.");
      const result = await summarizeEmail({ emailContent: email.body });
      setAiSummary(result.summary);
      speak(`Here is the summary: ${result.summary}`);
    } catch (error) {
      console.error("Summarization error:", error);
      speak("Sorry, I was unable to summarize the email.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [speak]);

  const handleReadAloud = useCallback((email: Email) => {
    speak(`Reading email from ${email.from}. Subject: ${email.subject}. Body: ${email.body}`);
  }, [speak]);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setAiSummary(null);
    const email = emails.find(e => e.id === id);
    if(email && !email.read) {
        setEmails(prev => prev.map(e => e.id === id ? {...e, read: true} : e));
    }
  };
  
  const handleCommand = useCallback(async (command: string) => {
    if (!command) return;

    // Cancel any ongoing speech from a previous command to avoid overlaps.
    cancelSpeech();

    const lowerCaseCommand = command.toLowerCase();

    const commands: { [key: string]: () => void } = {
        'inbox': () => { setCategory('inbox'); speak("Showing inbox."); },
        'received': () => { setCategory('inbox'); speak("Showing received emails."); },
        'sent': () => { setCategory('sent'); speak("Showing sent emails."); },
        'drafts': () => { setCategory('draft'); speak("Showing drafts."); },
        'read': () => selectedEmail && handleReadAloud(selectedEmail),
        'summarize': () => selectedEmail && handleSummarize(selectedEmail),
    };

    const keyword = Object.keys(commands).find(k => lowerCaseCommand.includes(k));
    if (keyword) {
        commands[keyword]();
        return;
    }

    // Contextual AI response
    setIsProcessingCommand(true);
    try {
        const contextForAI = selectedEmail ? `Current email context: Subject: ${selectedEmail.subject}, Body: ${selectedEmail.body}\n\n${conversationContext}` : conversationContext;
        const result = await contextualResponse({ query: command, context: contextForAI });
        speak(result.response);
        setConversationContext(result.updatedContext);
    } catch (error) {
        console.error("Contextual response error:", error);
        speak("I'm sorry, I had trouble understanding that.");
    } finally {
        setIsProcessingCommand(false);
    }
}, [selectedEmail, handleReadAloud, handleSummarize, speak, conversationContext, cancelSpeech]);

  useEffect(() => {
    if (!isListening && transcript) {
      handleCommand(transcript);
      setTranscript('');
    }
  }, [isListening, transcript, handleCommand, setTranscript]);

  const filteredEmails = emails.filter((email) => email.category === category);
  const unreadCounts = {
    inbox: emails.filter(e => e.category === 'inbox' && !e.read).length,
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <SidebarProvider>
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
                <SidebarMenuButton onClick={() => setCategory("inbox")} isActive={category === "inbox"} tooltip="Inbox">
                  <Inbox />
                  <span>Inbox</span>
                  {unreadCounts.inbox > 0 && <Badge className="ml-auto">{unreadCounts.inbox}</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCategory("sent")} isActive={category === "sent"} tooltip="Sent">
                  <Send />
                  <span>Sent</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setCategory("draft")} isActive={category === "draft"} tooltip="Drafts">
                  <FileText />
                  <span>Drafts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="text-xs text-muted-foreground p-4 text-center">
              <p>Use your voice to manage emails.</p>
              <p>Click the mic to start.</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full">
            <aside className="w-full max-w-sm border-r h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-2xl font-bold capitalize">{category}</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-2">
                  {filteredEmails.map((email) => (
                    <Card
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        selectedEmailId === email.id ? "border-primary bg-primary/5" : "bg-card"
                      )}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
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
                          <time suppressHydrationWarning className="text-xs text-muted-foreground self-start">{email.date === 'Draft' ? 'Draft' : new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </aside>
            <main className="flex-1 h-full flex flex-col">
              <ScrollArea className="flex-1">
                {selectedEmail ? (
                  <div className="p-6 space-y-6">
                    <header className="space-y-2">
                      <h2 className="text-3xl font-bold">{selectedEmail.subject}</h2>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{selectedEmail.from.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{selectedEmail.from}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <time suppressHydrationWarning>{selectedEmail.date === 'Draft' ? 'Draft' : new Date(selectedEmail.date).toLocaleString()}</time>
                      </div>
                    </header>
                    <Separator />
                    <div className="prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed whitespace-pre-wrap font-body">
                      {selectedEmail.body}
                    </div>
                    <Separator />
                     <div className="flex items-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => handleReadAloud(selectedEmail)}>
                            <User className="mr-2 h-4 w-4"/> Read Aloud
                        </Button>
                        <Button onClick={() => handleSummarize(selectedEmail)} disabled={isLoadingSummary}>
                            <Bot className="mr-2 h-4 w-4"/> Summarize with AI
                        </Button>
                    </div>

                    {isLoadingSummary && (
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    )}
                    {aiSummary && (
                        <Alert className="mt-4 bg-accent/10 border-accent/50">
                            <Bot className="h-4 w-4 text-accent" />
                            <AlertTitle className="text-accent font-bold">AI Summary</AlertTitle>
                            <AlertDescription>
                                {aiSummary}
                            </AlertDescription>
                        </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <p>Select an email to read</p>
                  </div>
                )}
              </ScrollArea>
            </main>
          </div>
        </SidebarInset>
        <VoiceButton 
            isListening={isListening} 
            isProcessing={isProcessingCommand}
            onClick={handleVoiceButtonClick} 
        />
         {isListening && (
            <div className="fixed bottom-28 right-8 bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-xl text-center">
                <p className="text-sm text-muted-foreground">Listening...</p>
                <p className="font-medium">{transcript || "..."}</p>
            </div>
        )}
      </SidebarProvider>
    </div>
  );
}
