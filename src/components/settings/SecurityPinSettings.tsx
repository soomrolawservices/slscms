import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Key, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useSecurityPin, useUpdateSecurityPin } from '@/hooks/useSecurityPin';

export function SecurityPinSettings() {
  const { data: currentPin, isLoading } = useSecurityPin();
  const updatePin = useUpdateSecurityPin();
  
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePin = () => {
    setError('');
    
    // Validate current PIN
    if (currentPinInput !== currentPin) {
      setError('Current PIN is incorrect');
      return;
    }
    
    // Validate new PIN
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }
    
    // Validate confirmation
    if (newPin !== confirmPin) {
      setError('New PIN and confirmation do not match');
      return;
    }
    
    // Prevent using same PIN
    if (newPin === currentPin) {
      setError('New PIN must be different from current PIN');
      return;
    }
    
    updatePin.mutate(newPin, {
      onSuccess: () => {
        setCurrentPinInput('');
        setNewPin('');
        setConfirmPin('');
      }
    });
  };

  return (
    <Card className="border-2 border-border overflow-hidden">
      <CardHeader className="border-b-2 border-border bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Security PIN</CardTitle>
            <CardDescription>
              Protect sensitive pages like Credentials, Payments, and Invoices
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 max-w-md">
          {/* Current PIN Display */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current PIN</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg tracking-widest">
                  {isLoading ? '••••' : showCurrentPin ? currentPin : '••••'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                >
                  {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Change PIN Form */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-pin" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Enter Current PIN
              </Label>
              <Input
                id="current-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="font-mono tracking-widest"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-pin">New PIN (4 digits)</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="font-mono tracking-widest"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-pin">Confirm New PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="font-mono tracking-widest"
              />
              {newPin && confirmPin && newPin === confirmPin && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  PINs match
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button 
              onClick={handleUpdatePin}
              disabled={updatePin.isPending || !currentPinInput || !newPin || !confirmPin}
              className="w-full"
            >
              {updatePin.isPending ? 'Updating...' : 'Update Security PIN'}
            </Button>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Protected Pages:</strong> Credentials, Payments, and Invoices require this PIN to access. Access is cached for 30 minutes after verification.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
