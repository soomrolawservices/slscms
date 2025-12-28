import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to verify JWT and get user
async function verifyAuth(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  return user;
}

// Helper function to check if user is admin
async function checkAdminRole(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || !data) {
    throw new Error('Forbidden: Admin access required');
  }

  // Also check if user is active
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .single();

  if (profileError || profile?.status !== 'active') {
    throw new Error('Forbidden: Account is not active');
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const user = await verifyAuth(req, supabase);
    console.log(`AI Analytics requested by user: ${user.id}`);

    // Verify admin role
    await checkAdminRole(supabase, user.id);
    console.log(`Admin access verified for user: ${user.id}`);

    // Fetch all data for analysis
    const [clientsRes, casesRes, paymentsRes, appointmentsRes, invoicesRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("cases").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("appointments").select("*"),
      supabase.from("invoices").select("*"),
    ]);

    const clients = clientsRes.data || [];
    const cases = casesRes.data || [];
    const payments = paymentsRes.data || [];
    const appointments = appointmentsRes.data || [];
    const invoices = invoicesRes.data || [];

    // Calculate statistics
    const totalRevenue = payments
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const pendingPayments = payments
      .filter((p) => p.status === "pending")
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const casesByStatus = cases.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const clientsByRegion = clients.reduce((acc: Record<string, number>, c) => {
      const region = c.region || "Unknown";
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    const appointmentsByType = appointments.reduce((acc: Record<string, number>, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});

    // Monthly revenue trend (last 6 months)
    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number; cases: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString().slice(0, 7);
      const monthPayments = payments.filter(
        (p) => p.status === "paid" && p.payment_date?.startsWith(monthStart)
      );
      const monthCases = cases.filter((c) => c.created_at?.startsWith(monthStart));
      
      monthlyRevenue.push({
        month: date.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: monthPayments.reduce((acc, p) => acc + (p.amount || 0), 0),
        cases: monthCases.length,
      });
    }

    const dataContext = `
      Law Firm Analytics Data:
      - Total Clients: ${clients.length}
      - Active Clients: ${clients.filter((c) => c.status === "active").length}
      - Total Cases: ${cases.length}
      - Cases by Status: ${JSON.stringify(casesByStatus)}
      - Total Revenue (Paid): $${totalRevenue.toLocaleString()}
      - Pending Payments: $${pendingPayments.toLocaleString()}
      - Total Appointments: ${appointments.length}
      - Scheduled Appointments: ${appointments.filter((a) => a.status === "scheduled").length}
      - Appointments by Type: ${JSON.stringify(appointmentsByType)}
      - Clients by Region: ${JSON.stringify(clientsByRegion)}
      - Monthly Revenue Trend (last 6 months): ${JSON.stringify(monthlyRevenue)}
      - Invoice Collection Rate: ${invoices.length > 0 ? ((invoices.filter((i) => i.status === "paid").length / invoices.length) * 100).toFixed(1) : 0}%
    `;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a legal practice management analytics AI. Analyze the provided law firm data and provide:
1. Key insights about the business performance
2. Trend predictions for the next month
3. Actionable recommendations to improve efficiency and revenue
4. Risk factors or concerns to address

Keep your response concise, professional, and actionable. Use bullet points for clarity.
Format your response in sections: Insights, Predictions, Recommendations, Alerts.`,
          },
          {
            role: "user",
            content: dataContext,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiAnalysis = aiData.choices?.[0]?.message?.content || "Unable to generate analysis";

    return new Response(
      JSON.stringify({
        analysis: aiAnalysis,
        stats: {
          totalClients: clients.length,
          activeClients: clients.filter((c) => c.status === "active").length,
          totalCases: cases.length,
          casesByStatus,
          totalRevenue,
          pendingPayments,
          appointmentsByType,
          clientsByRegion,
          monthlyRevenue,
          collectionRate: invoices.length > 0 
            ? ((invoices.filter((i) => i.status === "paid").length / invoices.length) * 100).toFixed(1)
            : 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes('Unauthorized') ? 401 : 
                   message.includes('Forbidden') ? 403 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
