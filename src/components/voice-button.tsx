"use client";

import { Mic, MicOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceButtonProps = {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
};

export function VoiceButton({ isListening, isProcessing, onClick }: VoiceButtonProps) {
  const Icon = isProcessing ? Loader : isListening ? MicOff : Mic;

  return (
    <Button
      onClick={onClick}
      disabled={isProcessing}
      size="icon"
      className={cn(
        "fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ease-in-out",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2",
        isListening && "bg-accent hover:bg-accent/90 scale-110",
        isProcessing && "cursor-not-allowed"
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      <Icon className={cn("h-8 w-8", isProcessing && "animate-spin")} />
    </Button>
  );
}
