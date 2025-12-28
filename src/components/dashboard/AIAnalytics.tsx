import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface AnalyticsData {
  analysis: string;
  stats: {
    totalClients: number;
    activeClients: number;
    totalCases: number;
    casesByStatus: Record<string, number>;
    totalRevenue: number;
    pendingPayments: number;
    appointmentsByType: Record<string, number>;
    clientsByRegion: Record<string, number>;
    monthlyRevenue: { month: string; revenue: number; cases: number }[];
    collectionRate: string;
  };
}

const COLORS = ['#008080', '#00205c', '#d4af37', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AIAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('ai-analytics');
      
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      
      setData(result);
    } catch (err: any) {
      console.error('Analytics error:', err);
      setError(err.message || 'Failed to load analytics');
      toast({ title: 'Failed to load AI analytics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const parseAnalysis = (text: string) => {
    const sections: Record<string, string[]> = {
      insights: [],
      predictions: [],
      recommendations: [],
      alerts: [],
    };

    let currentSection = '';
    const lines = text.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('insight')) currentSection = 'insights';
      else if (lower.includes('prediction')) currentSection = 'predictions';
      else if (lower.includes('recommendation')) currentSection = 'recommendations';
      else if (lower.includes('alert') || lower.includes('risk') || lower.includes('concern')) currentSection = 'alerts';
      else if (currentSection && line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
        sections[currentSection].push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }

    return sections;
  };

  const casesPieData = data?.stats?.casesByStatus 
    ? Object.entries(data.stats.casesByStatus).map(([name, value]) => ({ name, value }))
    : [];

  const appointmentsPieData = data?.stats?.appointmentsByType
    ? Object.entries(data.stats.appointmentsByType).map(([name, value]) => ({ name, value }))
    : [];

  const analysisData = data?.analysis ? parseAnalysis(data.analysis) : null;

  if (isLoading && !data) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your data with AI...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered Analytics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-card rounded-xl border shadow-sm">
              <p className="text-2xl font-bold text-primary">{data?.stats.totalClients || 0}</p>
              <p className="text-sm text-muted-foreground">Total Clients</p>
            </div>
            <div className="p-4 bg-card rounded-xl border shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">${(data?.stats.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="p-4 bg-card rounded-xl border shadow-sm">
              <p className="text-2xl font-bold text-amber-600">${(data?.stats.pendingPayments || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="p-4 bg-card rounded-xl border shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{data?.stats.collectionRate || 0}%</p>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
              Revenue & Cases Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data?.stats.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008080" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#008080" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#008080"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue ($)"
                />
                <Bar dataKey="cases" fill="#d4af37" name="Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cases by Status */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              Cases by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={casesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {casesPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insights */}
          {analysisData.insights.length > 0 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {analysisData.insights.slice(0, 5).map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Predictions */}
          {analysisData.predictions.length > 0 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-500/10 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {analysisData.predictions.slice(0, 5).map((prediction, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {prediction}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysisData.recommendations.length > 0 && (
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {analysisData.recommendations.slice(0, 5).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {analysisData.alerts.length > 0 && (
            <Card className="border-0 shadow-md overflow-hidden border-l-4 border-l-amber-500">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alerts & Risks
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {analysisData.alerts.slice(0, 5).map((alert, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      {alert}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Raw Analysis Fallback */}
      {data?.analysis && (!analysisData || Object.values(analysisData).every(arr => arr.length === 0)) && (
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {data.analysis}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
