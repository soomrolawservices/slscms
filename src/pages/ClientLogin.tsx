import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        let errorMessage = 'Invalid email or password.';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email before logging in.';
        }
        
        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      if (authData.user) {
        // Check user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching role:', roleError);
        }

        // Only allow client role to access client portal
        if (roleData?.role !== 'client') {
          await supabase.auth.signOut();
          toast({
            title: 'Access Denied',
            description: 'This login is for clients only. Please use the main login for team access.',
            variant: 'destructive',
          });
          return;
        }

        // Check user status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profile?.status === 'pending') {
          await supabase.auth.signOut();
          toast({
            title: 'Account Pending Approval',
            description: 'Your account is pending admin approval. You will be notified once approved.',
            variant: 'destructive',
          });
          return;
        }

        if (profile?.status === 'blocked') {
          await supabase.auth.signOut();
          toast({
            title: 'Account Blocked',
            description: 'Your account has been blocked. Please contact support.',
            variant: 'destructive',
          });
          return;
        }
      }

      navigate('/portal');
      toast({
        title: 'Welcome to Soomro Law Services!',
        description: 'You have successfully logged in to your client portal.',
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-border shadow-md">
        <CardHeader className="text-center border-b-2 border-border">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#006A4E] to-[#00857C] flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">SL</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Client Portal</CardTitle>
          <CardDescription className="text-base">
            Soomro Law Services
          </CardDescription>
          <p className="text-sm text-muted-foreground italic mt-2">
            Just Relax! You are in Safe Hands.
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-2 border-border pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#006A4E] to-[#00857C] hover:from-[#005A3E] hover:to-[#00756C]" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In to Portal'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link to="/client-signup" className="text-[#006A4E] font-medium hover:underline">
                Register as Client
              </Link>
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Team member?{' '}
              <Link to="/login" className="text-foreground font-medium hover:underline">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
