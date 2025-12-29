import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Users, FileText, Calendar, DollarSign, Shield, Clock, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
const features = [{
  icon: Users,
  title: 'Client Management',
  description: 'Manage all your clients with comprehensive profiles, contact details, and case history.'
}, {
  icon: FileText,
  title: 'Case Tracking',
  description: 'Track case progress, deadlines, and milestones with intuitive status management.'
}, {
  icon: Calendar,
  title: 'Appointments',
  description: 'Schedule and manage appointments with automatic reminders and calendar integration.'
}, {
  icon: DollarSign,
  title: 'Invoicing & Payments',
  description: 'Generate professional invoices, track payments, and manage billing efficiently.'
}, {
  icon: Shield,
  title: 'Secure Documents',
  description: 'Store and manage legal documents securely with role-based access controls.'
}, {
  icon: BarChart3,
  title: 'Analytics & Reports',
  description: 'Gain insights with comprehensive reports and analytics dashboards.'
}];
const benefits = ['Streamlined client communication', 'Automated appointment reminders', 'Secure document management', 'Real-time case status tracking', 'Professional invoice generation', 'Team collaboration tools', 'Role-based access control', 'Expense tracking and budgets'];
export default function Index() {
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Soomro Law Services
          </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/client-login">
              <Button variant="ghost">Client Portal</Button>
            </Link>
            <Link to="/login">
              <Button>Staff Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Legal Practice Management
            <span className="block text-primary mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Streamline your law practice with our comprehensive management system. 
            Handle clients, cases, documents, and billing all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/client-login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Client Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Practice
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools designed specifically for legal professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => <Card key={feature.title} className="border-2 border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Our legal practice management system helps you save time, reduce errors, 
                and provide better service to your clients.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map(benefit => <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>)}
              </div>
            </div>
            <div className="bg-muted rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Save 10+ Hours</h3>
                    <p className="text-muted-foreground">Per week on administrative tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Team Collaboration</h3>
                    <p className="text-muted-foreground">Work seamlessly with your team</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Enterprise Security</h3>
                    <p className="text-muted-foreground">Your data is always protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            Join law firms that have modernized their practice management.
            Get started today and see the difference.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Access Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="font-bold">Soomro Law Services</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Soomro Law Associates. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm">Staff Login</Link>
              <Link to="/client-login" className="text-muted-foreground hover:text-foreground text-sm">Client Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}