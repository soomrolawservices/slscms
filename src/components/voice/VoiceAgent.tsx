import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Bot, User, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { useNavigate } from 'react-router-dom';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceAgentProps {
  onClose?: () => void;
}

export function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check browser support
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognitionConstructor();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      
      if (result.isFinal) {
        handleUserInput(text);
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone Access Required',
          description: 'Please enable microphone access to use voice commands.',
          variant: 'destructive'
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    synthRef.current = window.speechSynthesis;

    // Load voices (may be async on some browsers)
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      setAvailableVoices(voices);
    };
    
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your AI voice assistant. I can help you with:\n\n• **Navigate** - Go to any page (e.g., 'Go to clients', 'Open dashboard')\n• **Search** - Find information (e.g., 'How many active cases?')\n• **Reports** - Get analytics (e.g., 'What's the total revenue?')\n• **Insights** - Ask business questions\n\nTry saying: 'Go to clients' or 'Show me revenue stats'",
      timestamp: new Date()
    }]);

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use best quality voice available
    const voices = availableVoices.length > 0 ? availableVoices : synthRef.current.getVoices();
    
    // Prioritize high-quality voices
    const preferredVoice = voices.find(v => 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Microsoft David') ||
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Daniel')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [isMuted, availableVoices]);

  // Handle navigation commands locally
  const handleNavigationCommand = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'home': '/dashboard',
      'clients': '/clients',
      'client': '/clients',
      'cases': '/cases',
      'case': '/cases',
      'documents': '/documents',
      'document': '/documents',
      'payments': '/payments',
      'payment': '/payments',
      'invoices': '/invoices',
      'invoice': '/invoices',
      'expenses': '/expenses',
      'expense': '/expenses',
      'appointments': '/appointments',
      'appointment': '/appointments',
      'calendar': '/appointments',
      'messages': '/messages',
      'message': '/messages',
      'chat': '/messages',
      'credentials': '/credentials',
      'users': '/users',
      'team': '/users',
      'settings': '/settings',
      'reports': '/reports',
      'analytics': '/reports',
      'permissions': '/permissions',
    };

    // Check for navigation intent
    const navPhrases = ['go to', 'open', 'show me', 'navigate to', 'take me to', 'show'];
    const hasNavIntent = navPhrases.some(phrase => lowerText.includes(phrase));
    
    if (hasNavIntent) {
      for (const [keyword, route] of Object.entries(routes)) {
        if (lowerText.includes(keyword)) {
          navigate(route);
          const pageName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Navigating to ${pageName}...`,
            timestamp: new Date()
          }]);
          speak(`Opening ${pageName}`);
          return true;
        }
      }
    }
    
    return false;
  }, [navigate, speak]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');

    // Check for navigation commands first
    if (handleNavigationCommand(text)) {
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: text,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          isVoiceCommand: true
        }
      });

      if (error) throw error;

      const response = data.response || "I couldn't process that request. Please try again.";
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response (clean markdown and limit length for TTS)
      const cleanResponse = response
        .replace(/[*#`_~]/g, '') // Remove markdown
        .replace(/\n+/g, '. ') // Replace newlines with pauses
        .substring(0, 500); // Limit length for TTS
      speak(cleanResponse);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to process voice command';
      
      // Handle common errors with helpful messages
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I need you to be logged in to access that information. Please make sure you're signed in.",
          timestamp: new Date()
        }]);
        speak("Please log in to use this feature.");
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "You don't have permission for this action. Only admins can access AI analytics.",
          timestamp: new Date()
        }]);
        speak("This feature requires admin permissions.");
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I had trouble processing that. You can ask me about your business data, navigate to pages, or get analytics. Try: 'Go to clients' or 'What's the revenue?'",
          timestamp: new Date()
        }]);
        speak("Sorry, I had trouble with that request. Please try again.");
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMute = useCallback(() => {
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  }, [isSpeaking, isMuted]);

  if (!isSupported) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Voice Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages */}
        <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg p-3",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <MarkdownRenderer 
                    content={msg.content} 
                    className="text-sm"
                    isUserMessage={msg.role === 'user'}
                  />
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Transcript */}
        {transcript && (
          <div className="px-4 py-2 bg-muted/50 border-t border-border/50">
            <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t border-border/50 flex items-center justify-center gap-4">
          <Button
            size="lg"
            className={cn(
              "rounded-full w-16 h-16 transition-all",
              isListening 
                ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                : "bg-accent hover:bg-accent/90"
            )}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Status */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            {isListening ? 'Listening... Speak now' : 
             isProcessing ? 'Processing...' : 
             isSpeaking ? 'Speaking...' : 
             'Click the microphone to start'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
