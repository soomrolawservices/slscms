import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Calendar, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Search,
  Moon,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Soomro Law Services',
    description: 'Your comprehensive legal practice management system. Let\'s take a quick tour to help you get started.',
    icon: Sparkles,
    tips: [
      'Manage clients, cases, and documents in one place',
      'Track payments and invoices efficiently',
      'Schedule and manage appointments',
      'AI-powered insights and analytics'
    ]
  },
  {
    id: 'clients',
    title: 'Managing Clients',
    description: 'Keep track of all your clients with a comprehensive 360° view.',
    icon: Users,
    tips: [
      'Add clients with detailed information',
      'View all client data in one unified profile',
      'Link clients to their user accounts',
      'Use drag-and-drop to change client status'
    ]
  },
  {
    id: 'cases',
    title: 'Case Management',
    description: 'Organize and track all your legal cases efficiently.',
    icon: Briefcase,
    tips: [
      'Create cases and link them to clients',
      'Use Kanban board for visual case management',
      'Track case activities and timeline',
      'Assign cases to team members'
    ]
  },
  {
    id: 'shortcuts',
    title: 'Productivity Features',
    description: 'Powerful shortcuts to help you work faster.',
    icon: Search,
    tips: [
      'Press ⌘+K (Ctrl+K) for quick search',
      'Double-click any cell to edit inline',
      'Drag status pills to update records',
      'Use Tab to navigate between fields'
    ]
  },
  {
    id: 'theme',
    title: 'Customize Your Experience',
    description: 'Personalize the interface to match your preferences.',
    icon: Moon,
    tips: [
      'Toggle between light and dark mode',
      'Access settings for notifications',
      'Configure your profile and preferences',
      'Set up security PIN for sensitive areas'
    ]
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start managing your practice. Need help anytime? Check the documentation.',
    icon: Check,
    tips: [
      'Explore the dashboard for insights',
      'Check settings to customize features',
      'View documentation for detailed guides',
      'Contact support if you need assistance'
    ]
  }
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setOpen(false);
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleSkip()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isLastStep ? "bg-accent" : "bg-primary"
            )}>
              <Icon className={cn(
                "h-6 w-6",
                isLastStep ? "text-accent-foreground" : "text-primary-foreground"
              )} />
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <h2 className="text-xl font-bold mb-2">{step.title}</h2>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {step.tips.map((tip, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-accent" />
                </div>
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tour
          </Button>
          
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} className={isLastStep ? 'bg-accent hover:bg-accent/90' : ''}>
              {isLastStep ? (
                <>
                  Get Started
                  <Check className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (!completed) {
      // Delay showing to let the app render first
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding };
}
