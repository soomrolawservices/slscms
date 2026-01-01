import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request, supabaseUrl: string, supabaseAnonKey: string) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Create a client with the user's token to verify their identity
  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
  
  const { data: { user }, error } = await userSupabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  return user;
}

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await verifyAuth(req, supabaseUrl, supabaseAnonKey);
    await checkAdminRole(supabase, user.id);

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    // Fetch current business data for context
    const [clientsRes, casesRes, paymentsRes, invoicesRes, appointmentsRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("cases").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("appointments").select("*"),
    ]);

    const clients = clientsRes.data || [];
    const cases = casesRes.data || [];
    const payments = paymentsRes.data || [];
    const invoices = invoicesRes.data || [];
    const appointments = appointmentsRes.data || [];

    // Calculate metrics
    const totalRevenue = payments.filter(p => p.status === "paid").reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === "pending").reduce((acc, p) => acc + (p.amount || 0), 0);
    const activeCases = cases.filter(c => c.status === "active" || c.status === "in_progress").length;
    const pendingCases = cases.filter(c => c.status === "pending").length;
    const collectionRate = invoices.length > 0 
      ? ((invoices.filter(i => i.status === "paid").length / invoices.length) * 100).toFixed(1) 
      : 0;

    const businessContext = `
Current Business Data:
- Total Clients: ${clients.length} (Active: ${clients.filter(c => c.status === "active").length})
- Total Cases: ${cases.length} (Active: ${activeCases}, Pending: ${pendingCases})
- Total Revenue (Paid): PKR ${totalRevenue.toLocaleString()}
- Pending Payments: PKR ${pendingPayments.toLocaleString()}
- Invoice Collection Rate: ${collectionRate}%
- Upcoming Appointments: ${appointments.filter(a => a.status === "scheduled").length}
- Cases by Status: ${JSON.stringify(cases.reduce((acc: any, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {}))}
`;

    const messages = [
      {
        role: "system",
        content: `You are an expert legal practice management AI assistant for Soomro Law Services. 
You help administrators make strategic decisions about their law practice.
You have access to real-time business data and can provide:
1. Strategic insights and recommendations
2. Financial analysis and projections
3. Case management advice
4. Client relationship suggestions
5. Resource allocation recommendations

Current Business Context:
${businessContext}

Always be professional, concise, and provide actionable insights. 
When suggesting improvements, be specific and explain the expected impact.
Use PKR for currency values.`,
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes('Unauthorized') ? 401 : 
                   message.includes('Forbidden') ? 403 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
