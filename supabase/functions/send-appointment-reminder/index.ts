import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Check if user is active
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (profileError || (profile as any)?.status !== 'active') {
    throw new Error('Forbidden: Account is not active');
  }

  return user;
}

// Check if user has access to the appointment
async function verifyAppointmentAccess(
  supabase: any, 
  userId: string, 
  appointmentId: string
) {
  // Check if user is admin
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminRole) return true;

  // Check if user is assigned to or created the appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, assigned_to, created_by')
    .eq('id', appointmentId)
    .maybeSingle();

  if (error || !appointment) {
    throw new Error('Appointment not found');
  }

  const apt = appointment as any;
  if (apt.assigned_to !== userId && apt.created_by !== userId) {
    throw new Error('Forbidden: No access to this appointment');
  }

  return true;
}

interface ReminderRequest {
  appointmentId: string;
  reminderMinutes: number;
}

// Validate input
function validateInput(body: unknown): ReminderRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { appointmentId, reminderMinutes } = body as Record<string, unknown>;

  // Validate appointmentId
  if (!appointmentId || typeof appointmentId !== 'string') {
    throw new Error('appointmentId is required and must be a string');
  }
  if (!isValidUUID(appointmentId)) {
    throw new Error('appointmentId must be a valid UUID');
  }

  // Validate reminderMinutes
  if (reminderMinutes === undefined || typeof reminderMinutes !== 'number') {
    throw new Error('reminderMinutes is required and must be a number');
  }
  if (!Number.isInteger(reminderMinutes) || reminderMinutes < 5 || reminderMinutes > 10080) {
    throw new Error('reminderMinutes must be an integer between 5 and 10080 (1 week)');
  }

  return { appointmentId, reminderMinutes };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const user = await verifyAuth(req, supabase);
    console.log(`Reminder requested by user: ${user.id}`);

    // Validate input
    const rawBody = await req.json();
    const { appointmentId, reminderMinutes } = validateInput(rawBody);
    console.log(`Validated input - appointmentId: ${appointmentId}, reminderMinutes: ${reminderMinutes}`);

    // Verify user has access to this appointment
    await verifyAppointmentAccess(supabase, user.id, appointmentId);
    console.log(`Access verified for user: ${user.id} to appointment: ${appointmentId}`);

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    await supabase
      .from("appointments")
      .update({ reminder_minutes: reminderMinutes })
      .eq("id", appointmentId);

    const clientEmail = appointment.client_email;
    // Sanitize user-provided content
    const clientName = escapeHtml(appointment.client_name || "Client");
    const topic = escapeHtml(appointment.topic);
    const date = escapeHtml(appointment.date);
    const time = escapeHtml(appointment.time);

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ success: true, message: "Reminder saved but no client email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const reminderText = reminderMinutes >= 60 
      ? `${Math.floor(reminderMinutes / 60)} hour${reminderMinutes >= 120 ? 's' : ''}` 
      : `${reminderMinutes} minutes`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #008080, #00205c); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Soomro Law Services</h1>
          <p style="color: #d4af37; margin: 5px 0 0 0;">Just Relax! You are in Safe Hands.</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
          <h2 style="color: #008080;">Appointment Reminder</h2>
          <p>Dear ${clientName},</p>
          <p>This is a reminder for your appointment:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #008080; margin: 20px 0;">
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          <p>Please be prepared ${reminderText} before.</p>
          <p>Best regards,<br><strong>Soomro Law Services</strong></p>
        </div>
        <div style="background: #00205c; color: white; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
          <p>📞 03095407616 | 03144622396</p>
          <p>✉️ soomrolawservices@gmail.com</p>
        </div>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Soomro Law Services <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Reminder: Appointment on ${date}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailRes.json();
    console.log("Email sent:", emailResult);

    if (appointment.assigned_to) {
      await supabase.from("notifications").insert({
        user_id: appointment.assigned_to,
        title: "Appointment Reminder Set",
        message: `Reminder set for ${clientName} - ${topic}`,
        type: "reminder",
        entity_type: "appointment",
        entity_id: appointmentId,
      });
    }

    await supabase
      .from("appointments")
      .update({ reminder_sent: true })
      .eq("id", appointmentId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    const status = message.includes('Unauthorized') ? 401 : 
                   message.includes('Forbidden') ? 403 : 
                   message.includes('must be') || message.includes('required') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
