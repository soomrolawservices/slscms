import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { VoiceAgent } from './VoiceAgent';
import { cn } from '@/lib/utils';

export function VoiceFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Voice Agent Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[90vw] sm:w-[400px] max-h-[70vh] animate-scale-in">
          <VoiceAgent onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* FAB Button */}
      <Button
        size="icon"
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-accent hover:bg-accent/90 text-accent-foreground",
          "transition-all hover:scale-105",
          isOpen && "bg-primary hover:bg-primary/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Mic className={cn("h-6 w-6", isOpen && "animate-pulse")} />
      </Button>
    </>
  );
}
