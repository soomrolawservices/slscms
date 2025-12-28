import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple UUID validation
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Sanitize string for HTML output - escape special characters
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

  if (profileError || (profile as any)?.status !== 'active') {
    throw new Error('Forbidden: Account is not active');
  }

  return true;
}

interface ExpenseNotificationRequest {
  expenseId: string;
  action: 'approved' | 'rejected';
  reason?: string;
}

// Validate input
function validateInput(body: unknown): ExpenseNotificationRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { expenseId, action, reason } = body as Record<string, unknown>;

  // Validate expenseId
  if (!expenseId || typeof expenseId !== 'string') {
    throw new Error('expenseId is required and must be a string');
  }
  if (!isValidUUID(expenseId)) {
    throw new Error('expenseId must be a valid UUID');
  }

  // Validate action
  if (!action || typeof action !== 'string') {
    throw new Error('action is required and must be a string');
  }
  if (action !== 'approved' && action !== 'rejected') {
    throw new Error('action must be either "approved" or "rejected"');
  }

  // Validate reason (optional)
  let validatedReason: string | undefined;
  if (reason !== undefined) {
    if (typeof reason !== 'string') {
      throw new Error('reason must be a string');
    }
    if (reason.length > 500) {
      throw new Error('reason must be 500 characters or less');
    }
    validatedReason = reason;
  }

  return { expenseId, action: action as 'approved' | 'rejected', reason: validatedReason };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const user = await verifyAuth(req, supabase);
    console.log(`Expense notification requested by user: ${user.id}`);

    // Verify admin role (only admins can approve/reject expenses)
    await checkAdminRole(supabase, user.id);
    console.log(`Admin access verified for user: ${user.id}`);

    // Validate input
    const rawBody = await req.json();
    const { expenseId, action, reason } = validateInput(rawBody);
    console.log(`Processing expense notification: ${action} for expense ${expenseId}`);

    // Get expense details
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*, profiles:created_by(email, name)')
      .eq('id', expenseId)
      .single();

    if (expenseError || !expense) {
      console.error('Error fetching expense:', expenseError);
      throw new Error('Expense not found');
    }

    const userEmail = expense.profiles?.email;
    // Sanitize user-provided content
    const userName = escapeHtml(expense.profiles?.name || 'Team Member');
    const expenseTitle = escapeHtml(expense.title);
    const expenseCategory = escapeHtml(expense.category || 'Other');
    const sanitizedReason = reason ? escapeHtml(reason) : undefined;

    if (!userEmail) {
      console.log('No email found for expense creator');
      return new Response(JSON.stringify({ success: true, message: 'No email to send' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const statusColor = action === 'approved' ? '#10B981' : '#EF4444';
    const statusText = action === 'approved' ? 'Approved' : 'Rejected';

    const emailResponse = await resend.emails.send({
      from: "Soomro Law Services <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Expense ${statusText}: ${expenseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: 600; }
            .expense-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #64748b; }
            .value { font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
            .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Soomro Law Services</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Expense Notification</p>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <p>Your expense submission has been reviewed:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <span class="status-badge" style="background-color: ${statusColor};">
                  ${statusText.toUpperCase()}
                </span>
              </div>
              
              <div class="expense-details">
                <div class="detail-row">
                  <span class="label">Title</span>
                  <span class="value">${expenseTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount</span>
                  <span class="value">PKR ${Number(expense.amount).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date</span>
                  <span class="value">${new Date(expense.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category</span>
                  <span class="value">${expenseCategory}</span>
                </div>
              </div>
              
              ${sanitizedReason ? `
              <div class="reason-box">
                <strong>Reason:</strong><br/>
                ${sanitizedReason}
              </div>
              ` : ''}
              
              <p>If you have any questions, please contact your administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Soomro Law Services Client Management System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create in-app notification with sanitized content
    await supabase.from('notifications').insert({
      user_id: expense.created_by,
      title: `Expense ${statusText}`,
      message: `Your expense "${expenseTitle}" for PKR ${Number(expense.amount).toLocaleString()} has been ${action}.${sanitizedReason ? ` Reason: ${sanitizedReason}` : ''}`,
      type: action === 'approved' ? 'success' : 'warning',
      entity_type: 'expense',
      entity_id: expenseId,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in expense-notification function:", message);
    const status = message.includes('Unauthorized') ? 401 : 
                   message.includes('Forbidden') ? 403 : 
                   message.includes('must be') || message.includes('required') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
