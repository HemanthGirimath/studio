"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useSpeech } from "@/hooks/use-speech";
import { fetchEmails, summarizeEmailAction, contextualResponseAction } from "@/app/actions";
import type { Email } from "@/app/types";
import { EmailSidebar } from "./gmail/EmailSidebar";
import { EmailList } from "./gmail/EmailList";
import { EmailDetail } from "./gmail/EmailDetail";
import { LoginView } from "./gmail/LoginView";
import { VoiceControl } from "./gmail/VoiceControl";

type EmailCategory = "inbox" | "sent" | "draft";

type GmailVoiceflowProps = {
    isAuthenticated: boolean;
    authorizationUrl: string;
}

export default function GmailVoiceflow({ isAuthenticated, authorizationUrl }: GmailVoiceflowProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [category, setCategory] = useState<EmailCategory>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [conversationContext, setConversationContext] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authPopup, setAuthPopup] = useState<Window | null>(null);
  const { transcript, isListening, startListening, stopListening, speak, setTranscript, cancelSpeech } = useSpeech();

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingEmails(true);
      fetchEmails()
        .then(response => {
          if (response.error === 'unauthorized') {
            window.location.href = '/';
            return;
          }
          if (response.error) {
            console.error("Error fetching emails:", response.error);
            return;
          }

          if (response.emails) {
            setEmails(response.emails);
            if (response.emails.length > 0) {
              const firstInbox = response.emails.find(e => e.category === 'inbox');
              if (firstInbox) setSelectedEmailId(firstInbox.id);
            }
          }
        })
        .catch(err => {
          console.error("An unexpected error occurred while fetching emails:", err);
           window.location.href = '/';
        })
        .finally(() => setIsLoadingEmails(false));
    }
  }, [isAuthenticated]);


  const filteredEmails = useMemo(
  () => emails.filter((email) => email.category === category),
  [emails, category]
);


const unreadCounts = useMemo(() => {
  return {
    inbox: emails.filter(e => e.category === 'inbox' && !e.read).length,
    sent: emails.filter(e => e.category === 'sent' && !e.read).length,
    draft: emails.filter(e => e.category === 'draft' && !e.read).length,
  };
}, [emails]);



  const handleVoiceButtonClick = () => {
    cancelSpeech();
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
      const result = await summarizeEmailAction(email.body);
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

    setIsProcessingCommand(true);
    try {
        const contextForAI = selectedEmail ? `Current email context: Subject: ${selectedEmail.subject}, Body: ${selectedEmail.body}\n\n${conversationContext}` : conversationContext;
        const result = await contextualResponseAction(command, contextForAI);
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

  const handleSignIn = () => {
    console.log("handleSignIn: Opening Google authentication popup.");
    const popup = window.open(authorizationUrl, '_blank', 'noreferrer,width=500,height=600');
    setAuthPopup(popup);
  };

  useEffect(() => {
    if (!authPopup) return;

    const timer = setInterval(() => {
      if (authPopup.closed) {
        clearInterval(timer);
        console.log("Auth popup closed. Reloading window.");
        window.location.reload();
      }
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [authPopup]);

  if (!isAuthenticated) {
    return (
      <LoginView 
        authorizationUrl={authorizationUrl}
        handleSignIn={handleSignIn}
        authError={authError}
      />
    );
  }


  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      <SidebarProvider>
        <div className="flex-1 flex flex-row overflow-hidden">
          <EmailSidebar 
            category={category}
            setCategory={setCategory}
            unreadCounts={unreadCounts}
          />
          <main className="flex-1 flex flex-row">
              <EmailList
                emails={filteredEmails}
                isLoading={isLoadingEmails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={handleSelectEmail}
                category={category}
              />
              <EmailDetail
                email={selectedEmail}
                aiSummary={aiSummary}
                isLoadingSummary={isLoadingSummary}
                onSummarize={handleSummarize}
                onReadAloud={handleReadAloud}
              />
          </main>
        </div>
        <VoiceControl
            isListening={isListening}
            isProcessing={isProcessingCommand}
            transcript={transcript}
            onClick={handleVoiceButtonClick}
        />
      </SidebarProvider>
    </div>
  );
}
