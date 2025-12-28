import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { useSignupSettings } from '@/hooks/useSignupSettings';

export default function ClientSignup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: signupSettings, isLoading: settingsLoading } = useSignupSettings();

  const isSignupEnabled = signupSettings?.client_signup_enabled ?? true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/portal`;
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            cnic: formData.cnic,
            role: 'client', // This will be picked up by handle_new_user trigger
          },
        },
      });

      if (authError) {
        let errorMessage = 'Registration failed. Please try again.';
        if (authError.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        }
        
        toast({
          title: 'Registration failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitted(true);
      toast({
        title: 'Registration submitted',
        description: 'Your request is pending admin approval.',
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show disabled message if signups are disabled
  if (!settingsLoading && !isSignupEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2 border-border shadow-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl">
                <XCircle className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Signups Disabled</CardTitle>
            <CardDescription>
              Client portal registration is currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please contact Soomro Law Services for access to the client portal.
            </p>
          </CardContent>
          <CardFooter className="border-t-2 border-border pt-6">
            <Link to="/client-login" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2 border-border shadow-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-600 text-white rounded-xl">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Registration Submitted</CardTitle>
            <CardDescription>
              Your client account request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 border-2 border-border rounded-lg">
              <p className="text-sm">
                Your account is <strong>pending approval</strong>. An administrator will review your request and link your account to your client profile.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You will be able to access your Client Portal once your account has been approved and linked.
            </p>
          </CardContent>
          <CardFooter className="border-t-2 border-border pt-6">
            <Link to="/client-login" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            Soomro Law Services - Create Account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC / ID Number</Label>
              <Input 
                id="cnic"
                value={formData.cnic}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="bg-gradient-to-r from-[#006A4E]/10 to-[#00857C]/10 p-3 border-2 border-[#006A4E]/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> After registration, an administrator will review and link your account to your client profile. You will receive access to view your cases, documents, and more.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-2 border-border pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#006A4E] to-[#00857C] hover:from-[#005A3E] hover:to-[#00756C]" 
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Create Client Account'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/client-login" className="text-[#006A4E] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
