import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, FileText, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PublicForms() {
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['public-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_forms')
        .select('id, title, description')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Public Forms | Soomro Law Services" description="Fill out forms shared by Soomro Law Services" />
      <header className="border-b border-border bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">Soomro Law Services</span>
          </Link>
          <Link to="/login"><Button variant="outline" size="sm">Staff Login</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Available Forms</h1>
          <p className="text-muted-foreground mb-8">Select a form below to fill it out. No login required.</p>
          {isLoading ? (
            <p className="text-muted-foreground">Loading forms...</p>
          ) : forms.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No public forms available right now.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {forms.map((form) => (
                <Link key={form.id} to={`/forms/${form.id}`}>
                  <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{form.title}</CardTitle>
                            {form.description && <CardDescription className="mt-1">{form.description}</CardDescription>}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}