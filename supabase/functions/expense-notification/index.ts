import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpenseNotificationRequest {
  expenseId: string;
  action: 'approved' | 'rejected';
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expenseId, action, reason }: ExpenseNotificationRequest = await req.json();
    console.log(`Processing expense notification: ${action} for expense ${expenseId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const userName = expense.profiles?.name || 'Team Member';

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
      subject: `Expense ${statusText}: ${expense.title}`,
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
                  <span class="value">${expense.title}</span>
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
                  <span class="value">${expense.category || 'Other'}</span>
                </div>
              </div>
              
              ${reason ? `
              <div class="reason-box">
                <strong>Reason:</strong><br/>
                ${reason}
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

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: expense.created_by,
      title: `Expense ${statusText}`,
      message: `Your expense "${expense.title}" for PKR ${Number(expense.amount).toLocaleString()} has been ${action}.${reason ? ` Reason: ${reason}` : ''}`,
      type: action === 'approved' ? 'success' : 'warning',
      entity_type: 'expense',
      entity_id: expenseId,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in expense-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
