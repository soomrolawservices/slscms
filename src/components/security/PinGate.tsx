import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSecurityPin } from '@/hooks/useSecurityPin';

interface PinGateProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const SESSION_KEY = 'pin_verified_pages';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface VerifiedSession {
  timestamp: number;
  pages: string[];
}

export function PinGate({ children, title, description }: PinGateProps) {
  const { data: storedPin, isLoading: isPinLoading } = useSecurityPin();
  const [isVerified, setIsVerified] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [attempts, setAttempts] = useState(0);

  const pageKey = title.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    // Check if this page was recently verified
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session: VerifiedSession = JSON.parse(stored);
        const now = Date.now();
        if (now - session.timestamp < SESSION_DURATION && session.pages.includes(pageKey)) {
          setIsVerified(true);
        }
      } catch {
        // Invalid session data
      }
    }
  }, [pageKey]);

  const handleVerify = () => {
    if (!storedPin) return;
    
    if (pinInput === storedPin) {
      setIsVerified(true);
      setShowPinDialog(false);
      setPinInput('');
      setAttempts(0);

      // Store in session
      const stored = sessionStorage.getItem(SESSION_KEY);
      let session: VerifiedSession = { timestamp: Date.now(), pages: [] };
      if (stored) {
        try {
          session = JSON.parse(stored);
        } catch {
          // Use new session
        }
      }
      session.timestamp = Date.now();
      if (!session.pages.includes(pageKey)) {
        session.pages.push(pageKey);
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

      toast({ 
        title: 'Access Granted', 
        description: `You have access to ${title} for 30 minutes` 
      });
    } else {
      setAttempts(prev => prev + 1);
      setPinInput('');
      if (attempts >= 2) {
        toast({ 
          title: 'Too many attempts', 
          description: 'Please try again later',
          variant: 'destructive' 
        });
        setShowPinDialog(false);
        setAttempts(0);
      } else {
        toast({ 
          title: 'Invalid PIN', 
          description: `${3 - attempts - 1} attempts remaining`,
          variant: 'destructive' 
        });
      }
    }
  };

  const handleLock = () => {
    setIsVerified(false);
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session: VerifiedSession = JSON.parse(stored);
        session.pages = session.pages.filter(p => p !== pageKey);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        // Ignore
      }
    }
    toast({ title: 'Page Locked', description: 'PIN required for access' });
  };

  // Show loading while fetching PIN
  if (isPinLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <Card className="border-2 border-border">
          <CardContent className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading security...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>

          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                <div className="relative p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                  <Lock className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Protected Area</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                This page contains sensitive information and requires additional authentication to access.
              </p>
              <Button 
                onClick={() => setShowPinDialog(true)}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25"
              >
                <Key className="h-5 w-5 mr-2" />
                Enter Security PIN
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Access will be granted for 30 minutes after verification
              </p>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="sm:max-w-sm border-2 border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                Security Verification
              </DialogTitle>
              <DialogDescription>
                Enter your 4-digit security PIN to access {title}
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="text-center text-3xl tracking-[1em] font-mono h-14"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pinInput.length === 4) {
                    handleVerify();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPinDialog(false);
                  setPinInput('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={pinInput.length !== 4}
                className="bg-gradient-to-r from-amber-500 to-amber-600"
              >
                Verify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="relative">
      {/* Lock button in header */}
      <div className="absolute top-0 right-0 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLock}
          className="text-amber-600 border-amber-500/50 hover:bg-amber-500/10 shadow-sm"
        >
          <Lock className="h-4 w-4 mr-2" />
          Lock
        </Button>
      </div>
      {children}
    </div>
  );
}

