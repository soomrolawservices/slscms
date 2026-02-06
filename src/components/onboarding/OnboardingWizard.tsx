import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Search,
  Moon,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
  pointer?: string;
}

const teamSteps: OnboardingStep[] = [
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
    ],
    pointer: 'sidebar'
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
    ],
    pointer: 'Clients menu item in sidebar'
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
    ],
    pointer: 'Cases menu item in sidebar'
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
    ],
    pointer: 'Search bar in header'
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
    ],
    pointer: 'Theme toggle in header'
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

const clientSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Client Portal',
    description: 'Access all your legal matters, documents, and communication in one secure place.',
    icon: Sparkles,
    tips: [
      'View your active cases and their status',
      'Access and download your documents',
      'Communicate with your legal team',
      'Book and manage appointments'
    ],
    pointer: 'dashboard'
  },
  {
    id: 'cases',
    title: 'Your Cases',
    description: 'Track the progress of all your legal matters in real-time.',
    icon: Briefcase,
    tips: [
      'View case status and updates',
      'See timeline of case activities',
      'Access related documents',
      'Track important deadlines'
    ],
    pointer: 'Cases section'
  },
  {
    id: 'documents',
    title: 'Document Access',
    description: 'Securely access all documents related to your cases.',
    icon: FileText,
    tips: [
      'Download documents anytime',
      'Upload required documents',
      'View document history',
      'Organized by case and category'
    ],
    pointer: 'Documents section'
  },
  {
    id: 'messaging',
    title: 'Communication',
    description: 'Stay connected with your legal team through secure messaging.',
    icon: MessageSquare,
    tips: [
      'Send messages to your assigned team',
      'Receive updates on your cases',
      'Ask questions anytime',
      'All communications are secure'
    ],
    pointer: 'Messages section'
  },
  {
    id: 'appointments',
    title: 'Schedule Appointments',
    description: 'Easily book and manage meetings with your legal team.',
    icon: Calendar,
    tips: [
      'View available time slots',
      'Book consultations online',
      'Receive reminders before appointments',
      'Reschedule when needed'
    ],
    pointer: 'Appointments section'
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Your portal is ready to use. We\'re here to help with your legal needs.',
    icon: Check,
    tips: [
      'Check your dashboard regularly',
      'Keep your contact info updated',
      'Upload documents as requested',
      'Contact us if you need assistance'
    ]
  }
];

interface OnboardingWizardProps {
  onComplete: () => void;
  isClient?: boolean;
}

export function OnboardingWizard({ onComplete, isClient = false }: OnboardingWizardProps) {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const steps = isClient ? clientSteps : teamSteps;
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

  const handleComplete = async () => {
    setOpen(false);
    // Store in user preferences in database
    if (user?.id) {
      try {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          preference_key: 'onboarding_completed',
          preference_value: JSON.stringify(true),
        }, { onConflict: 'user_id,preference_key' });
      } catch (error) {
        console.error('Error saving onboarding preference:', error);
      }
    }
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

export function useOnboardingForUser(userId: string | undefined, isClient: boolean = false) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!userId || hasChecked) {
      setIsLoading(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_key', 'onboarding_completed')
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding:', error);
          setIsLoading(false);
          setHasChecked(true);
          return;
        }

        // Check if preference exists and is truthy
        // preference_value is JSONB, so it could be true, "true", or { value: true }
        const isCompleted = data?.preference_value === true || 
                           data?.preference_value === 'true' ||
                           (typeof data?.preference_value === 'string' && data.preference_value.includes('true'));

        if (!isCompleted) {
          // Only show after delay to let app render
          setTimeout(() => setShowOnboarding(true), 1000);
        }
        
        setHasChecked(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [userId, hasChecked]);

  const resetOnboarding = async () => {
    if (!userId) return;
    
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('preference_key', 'onboarding_completed');
    
    setHasChecked(false);
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding, isLoading };
}
