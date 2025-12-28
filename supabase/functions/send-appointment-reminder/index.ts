import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  appointmentId: string;
  reminderMinutes: number;
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

    const { appointmentId, reminderMinutes }: ReminderRequest = await req.json();

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
    const clientName = appointment.client_name || "Client";

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ success: true, message: "Reminder saved but no client email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const reminderText = reminderMinutes >= 60 
      ? `${reminderMinutes / 60} hour${reminderMinutes >= 120 ? 's' : ''}` 
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
            <p><strong>Topic:</strong> ${appointment.topic}</p>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
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
        subject: `Reminder: Appointment on ${appointment.date}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailRes.json();
    console.log("Email sent:", emailResult);

    if (appointment.assigned_to) {
      await supabase.from("notifications").insert({
        user_id: appointment.assigned_to,
        title: "Appointment Reminder Set",
        message: `Reminder set for ${clientName} - ${appointment.topic}`,
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
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
