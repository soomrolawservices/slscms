import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Scale, CheckCircle } from 'lucide-react';

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSubmitted(true);
    toast({
      title: 'Registration submitted',
      description: 'Your request is pending admin approval.',
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2 border-border shadow-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary text-primary-foreground">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Registration Submitted</CardTitle>
            <CardDescription>
              Your account request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 border-2 border-border">
              <p className="text-sm">
                Your account is <strong>pending approval</strong>. An administrator will review your request and activate your account.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You will receive an email notification once your account has been approved.
            </p>
          </CardContent>
          <CardFooter className="border-t-2 border-border pt-6">
            <Link to="/login" className="w-full">
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
            <div className="p-4 bg-primary text-primary-foreground">
              <Scale className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Join LegalFlow</CardTitle>
          <CardDescription>
            Create a team member account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC / ID Number</Label>
              <Input id="cnic" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" required />
            </div>

            <div className="bg-muted p-3 border-2 border-border">
              <p className="text-xs text-muted-foreground">
                Note: Your account will be in a pending state until an administrator approves your registration.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-2 border-border pt-6">
            <Button 
              type="submit" 
              className="w-full shadow-xs" 
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
