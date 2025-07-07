"use client";

import React from 'react';
import { VoiceButton } from '@/components/voice-button';

type VoiceControlProps = {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  onClick: () => void;
};

export function VoiceControl({ isListening, isProcessing, transcript, onClick }: VoiceControlProps) {
  return (
    <>
      <VoiceButton isListening={isListening} isProcessing={isProcessing} onClick={onClick} />
      {isListening && (
        <div className="fixed bottom-28 right-8 bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-xl text-center">
          <p className="text-sm text-muted-foreground">Listening...</p>
          <p className="font-medium">{transcript || '...'}</p>
        </div>
      )}
    </>
  );
}
