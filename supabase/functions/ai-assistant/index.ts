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

    // Fetch ALL business data for comprehensive context
    const [
      clientsRes,
      casesRes,
      paymentsRes,
      invoicesRes,
      appointmentsRes,
      expensesRes,
      documentsRes,
      profilesRes,
      itrReturnsRes,
    ] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("cases").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("invoices").select("*, invoice_line_items(*)"),
      supabase.from("appointments").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("documents").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("itr_returns").select("*"),
    ]);

    const clients = clientsRes.data || [];
    const cases = casesRes.data || [];
    const payments = paymentsRes.data || [];
    const invoices = invoicesRes.data || [];
    const appointments = appointmentsRes.data || [];
    const expenses = expensesRes.data || [];
    const documents = documentsRes.data || [];
    const profiles = profilesRes.data || [];
    const itrReturns = itrReturnsRes.data || [];

    // Calculate comprehensive metrics
    // Revenue metrics - payments use "completed" status, not "paid"
    const totalPaidRevenue = payments
      .filter(p => p.status === "completed")
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    
    const pendingPayments = payments
      .filter(p => p.status === "pending")
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const totalInvoiceAmount = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paidInvoiceAmount = invoices
      .filter(i => i.status === "paid")
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const unpaidInvoiceAmount = invoices
      .filter(i => i.status === "unpaid" || i.status === "overdue")
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    // Case metrics
    const activeCases = cases.filter(c => c.status === "active" || c.status === "in_progress").length;
    const pendingCases = cases.filter(c => c.status === "pending").length;
    const closedCases = cases.filter(c => c.status === "closed" || c.status === "archived").length;

    // Client metrics
    const activeClients = clients.filter(c => c.status === "active").length;
    const individualClients = clients.filter(c => c.client_type === "individual").length;
    const businessClients = clients.filter(c => c.client_type === "business").length;

    // Expense metrics by type
    const approvedExpenses = expenses.filter(e => e.status === "approved");
    const totalExpenses = approvedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    const expensesByType: Record<string, number> = {};
    approvedExpenses.forEach(e => {
      const type = e.expense_type || e.category || 'general';
      expensesByType[type] = (expensesByType[type] || 0) + (Number(e.amount) || 0);
    });

    // Appointment metrics
    const scheduledAppointments = appointments.filter(a => a.status === "scheduled").length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;
    const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;

    // Team metrics
    const activeTeamMembers = profiles.filter(p => p.status === "active").length;
    const pendingTeamMembers = profiles.filter(p => p.status === "pending").length;

    // ITR metrics
    const completedITR = itrReturns.filter(r => r.progress === "completed").length;
    const pendingITR = itrReturns.filter(r => r.progress === "pending" || r.progress === "in_progress").length;
    const itrRevenue = itrReturns
      .filter(r => r.payment_status === "paid")
      .reduce((acc, r) => acc + (Number(r.payment_amount) || 0), 0);

    // Collection rate
    const collectionRate = invoices.length > 0 
      ? ((invoices.filter(i => i.status === "paid").length / invoices.length) * 100).toFixed(1) 
      : 0;

    // Time-based analysis
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const thisMonthPayments = payments.filter(p => {
      const date = new Date(p.created_at);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear && p.status === "completed";
    }).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const thisMonthExpenses = approvedExpenses.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Net profit calculation
    const netProfit = totalPaidRevenue - totalExpenses;
    const profitMargin = totalPaidRevenue > 0 ? ((netProfit / totalPaidRevenue) * 100).toFixed(1) : 0;

    const businessContext = `
=== SOOMRO LAW SERVICES - COMPLETE BUSINESS DATA ===

📊 FINANCIAL OVERVIEW:
- Total Historical Revenue (Paid Payments): PKR ${totalPaidRevenue.toLocaleString()}
- Total Invoice Amount (All Time): PKR ${totalInvoiceAmount.toLocaleString()}
- Paid Invoices: PKR ${paidInvoiceAmount.toLocaleString()}
- Unpaid/Overdue Invoices: PKR ${unpaidInvoiceAmount.toLocaleString()}
- Pending Payments: PKR ${pendingPayments.toLocaleString()}
- This Month Revenue: PKR ${thisMonthPayments.toLocaleString()}
- Invoice Collection Rate: ${collectionRate}%

💰 EXPENSES & PROFITABILITY:
- Total Operating Expenses: PKR ${totalExpenses.toLocaleString()}
- This Month Expenses: PKR ${thisMonthExpenses.toLocaleString()}
- Net Profit (Revenue - Expenses): PKR ${netProfit.toLocaleString()}
- Profit Margin: ${profitMargin}%

📂 EXPENSE BREAKDOWN:
${Object.entries(expensesByType).map(([type, amount]) => `  - ${type}: PKR ${amount.toLocaleString()}`).join('\n')}

👥 CLIENTS:
- Total Clients: ${clients.length}
- Active Clients: ${activeClients}
- Individual Clients: ${individualClients}
- Business Clients: ${businessClients}

📁 CASES:
- Total Cases: ${cases.length}
- Active Cases: ${activeCases}
- Pending Cases: ${pendingCases}
- Closed/Archived: ${closedCases}
- Cases by Status: ${JSON.stringify(cases.reduce((acc: any, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {}))}

📅 APPOINTMENTS:
- Total Appointments: ${appointments.length}
- Scheduled (Upcoming): ${scheduledAppointments}
- Completed: ${completedAppointments}
- Cancelled: ${cancelledAppointments}

📑 INVOICES:
- Total Invoices: ${invoices.length}
- Paid: ${invoices.filter(i => i.status === "paid").length}
- Unpaid: ${invoices.filter(i => i.status === "unpaid").length}
- Overdue: ${invoices.filter(i => i.status === "overdue").length}

💵 PAYMENTS:
- Total Payments: ${payments.length}
- Completed: ${payments.filter(p => p.status === "completed").length}
- Pending: ${payments.filter(p => p.status === "pending").length}
- Total Completed Amount: PKR ${totalPaidRevenue.toLocaleString()}

📄 DOCUMENTS:
- Total Documents: ${documents.length}

👨‍💼 TEAM:
- Active Team Members: ${activeTeamMembers}
- Pending Approvals: ${pendingTeamMembers}

📋 ITR (Tax Returns):
- Total ITR Returns: ${itrReturns.length}
- Completed: ${completedITR}
- In Progress/Pending: ${pendingITR}
- ITR Revenue Collected: PKR ${itrRevenue.toLocaleString()}
`;

    const messages = [
      {
        role: "system",
        content: `You are an expert legal practice management AI assistant for Soomro Law Services, a law firm based in Pakistan. 
You have FULL ACCESS to all business data and can provide comprehensive insights.

Your capabilities:
1. Financial Analysis - Revenue, expenses, profitability, cash flow analysis
2. Case Management - Track case status, workload, efficiency metrics
3. Client Analytics - Client acquisition, retention, value analysis
4. Expense Tracking - Operating costs, budget analysis, cost optimization
5. Team Performance - Workload distribution, productivity insights
6. Business Intelligence - Trends, forecasts, strategic recommendations
7. ITR/Tax Services - Tax return tracking, compliance status

CURRENT BUSINESS DATA:
${businessContext}

IMPORTANT GUIDELINES:
- Always use PKR for currency values
- Be specific with numbers and percentages
- Provide actionable insights and recommendations
- Reference actual data when answering questions
- When comparing periods, use available data
- For revenue questions, use the Total Historical Revenue figure
- For profit analysis, use Net Profit and Profit Margin
- Explain calculations when providing financial insights`,
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
