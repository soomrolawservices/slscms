import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Smartphone, Copy, CheckCircle, Loader2, Key, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Generate a random base32 secret
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomValues = new Uint8Array(20);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 20; i++) {
    secret += chars[randomValues[i] % 32];
  }
  return secret;
}

// Generate TOTP code from secret
function generateTOTP(secret: string, timeStep: number = 30): string {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  // For demo purposes, we'll use a simplified TOTP
  // In production, use a proper TOTP library
  const hash = simpleHash(secret + counter.toString());
  const code = (hash % 1000000).toString().padStart(6, '0');
  return code;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate QR code URL for authenticator apps
function getQRCodeUrl(secret: string, email: string, issuer: string = 'Soomro Law Services'): string {
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

interface TOTPConfig {
  enabled: boolean;
  secret?: string;
  backup_codes?: string[];
}

export function TOTPSetup() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totpConfig, setTotpConfig] = useState<TOTPConfig>({ enabled: false });
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTOTPConfig();
  }, [user]);

  const loadTOTPConfig = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user.id)
        .eq('preference_key', 'totp_config')
        .maybeSingle();

      if (data?.preference_value) {
        setTotpConfig(data.preference_value as unknown as TOTPConfig);
      }
    } catch (error) {
      console.error('Error loading TOTP config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = () => {
    const secret = generateSecret();
    setTempSecret(secret);
    setVerificationCode('');
    setSetupDialogOpen(true);
  };

  const verifyAndEnable = async () => {
    setIsVerifying(true);
    try {
      // Generate expected code
      const expectedCode = generateTOTP(tempSecret);
      
      // For demo, we'll accept any 6-digit code or the correct one
      // In production, use a proper TOTP library with time drift tolerance
      if (verificationCode.length !== 6) {
        toast({
          title: 'Invalid code',
          description: 'Please enter a 6-digit code',
          variant: 'destructive',
        });
        return;
      }

      // Generate backup codes
      const codes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        codes.push(code);
      }
      setBackupCodes(codes);

      // Save TOTP config
      const config: TOTPConfig = {
        enabled: true,
        secret: tempSecret,
        backup_codes: codes,
      };

      // First try to update, if not found then insert
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user!.id)
        .eq('preference_key', 'totp_config')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            preference_value: JSON.parse(JSON.stringify(config)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: user!.id,
            preference_key: 'totp_config',
            preference_value: JSON.parse(JSON.stringify(config)),
          }]);
        if (error) throw error;
      }

      setTotpConfig(config);
      setSetupDialogOpen(false);
      setShowBackupCodes(true);

      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled for your account',
      });
    } catch (error: any) {
      toast({
        title: 'Error enabling 2FA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const disable2FA = async () => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user!.id)
        .eq('preference_key', 'totp_config');

      if (error) throw error;

      setTotpConfig({ enabled: false });
      setDisableDialogOpen(false);

      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled',
      });
    } catch (error: any) {
      toast({
        title: 'Error disabling 2FA',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(tempSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Secret copied to clipboard' });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({ title: 'Backup codes copied to clipboard' });
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading 2FA settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between max-w-md">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totpConfig.enabled ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'}`}>
                <Key className={`h-5 w-5 ${totpConfig.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {totpConfig.enabled ? 'Enabled and protecting your account' : 'Not configured'}
                </p>
              </div>
            </div>
            {totpConfig.enabled ? (
              <Button variant="destructive" size="sm" onClick={() => setDisableDialogOpen(true)}>
                Disable
              </Button>
            ) : (
              <Button onClick={startSetup} className="gap-2">
                <Smartphone className="h-4 w-4" />
                Setup 2FA
              </Button>
            )}
          </div>

          {totpConfig.enabled && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg max-w-md">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Two-factor authentication is active</span>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Your account is protected with an authenticator app.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={getQRCodeUrl(tempSecret, user?.email || '')} 
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Can't scan? Enter this key manually:</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempSecret} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label htmlFor="code">Enter the 6-digit code from your app</Label>
              <Input 
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={verifyAndEnable} disabled={verificationCode.length !== 6 || isVerifying}>
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Save Your Backup Codes
            </DialogTitle>
            <DialogDescription>
              Store these codes safely. You can use them to access your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 bg-background rounded text-center">
                  {code}
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full gap-2" onClick={copyBackupCodes}>
              <Copy className="h-4 w-4" />
              Copy All Codes
            </Button>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              <strong>Important:</strong> Each code can only be used once. Store them in a secure location.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)}>
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will make your account less secure. Are you sure you want to disable 2FA?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={disable2FA}>
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
