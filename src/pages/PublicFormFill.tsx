import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Scale, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export default function PublicFormFill() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .eq('id', formId!)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('form_submissions').insert({
        form_id: formId!,
        submitted_by: null,
        data: values as never,
        files: [] as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: 'Form submitted', description: 'Thank you for your submission.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Submission failed', description: e.message, variant: 'destructive' });
    },
  });

  const fields: FormField[] = (form?.fields as unknown as FormField[]) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !values[f.id]) {
        toast({ title: 'Required field missing', description: f.label, variant: 'destructive' });
        return;
      }
    }
    submit.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={form?.title ? `${form.title} | Form` : 'Form'} description={form?.description || 'Fill out this form'} />
      <header className="border-b border-border bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">Soomro Law Services</span>
          </Link>
          <Link to="/forms"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />All Forms</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <p className="text-muted-foreground">Loading form...</p>
          ) : !form ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">This form is not available.</CardContent></Card>
          ) : submitted ? (
            <Card className="border-2">
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Submission Received</h2>
                <p className="text-muted-foreground">Thank you for filling out the form. We will be in touch soon.</p>
                <Button onClick={() => navigate('/forms')}>Back to Forms</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">{form.title}</CardTitle>
                {form.description && <CardDescription>{form.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {fields.map((field) => {
                    const v = values[field.id];
                    const set = (val: unknown) => setValues((p) => ({ ...p, [field.id]: val }));
                    return (
                      <div key={field.id} className="grid gap-2">
                        <Label>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea placeholder={field.placeholder} value={(v as string) || ''} onChange={(e) => set(e.target.value)} required={field.required} />
                        ) : field.type === 'select' ? (
                          <Select value={(v as string) || ''} onValueChange={set}>
                            <SelectTrigger><SelectValue placeholder={field.placeholder || 'Select...'} /></SelectTrigger>
                            <SelectContent>
                              {(field.options || []).map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'radio' ? (
                          <RadioGroup value={(v as string) || ''} onValueChange={set}>
                            {(field.options || []).map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                                <Label htmlFor={`${field.id}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : field.type === 'checkbox' ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={!!v} onCheckedChange={(c) => set(!!c)} id={field.id} />
                            <Label htmlFor={field.id} className="font-normal cursor-pointer">{field.placeholder || 'Yes'}</Label>
                          </div>
                        ) : (
                          <Input
                            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                            placeholder={field.placeholder}
                            value={(v as string) || ''}
                            onChange={(e) => set(e.target.value)}
                            required={field.required}
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button type="submit" className="w-full" disabled={submit.isPending}>
                    {submit.isPending ? 'Submitting...' : 'Submit Form'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}