import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const payload = await req.json()
    const { flow_rate, pressure, temperature, idTroncon } = payload

    if (typeof flow_rate !== 'number' || typeof pressure !== 'number') {
      throw new Error("Format de données invalide venant des capteurs.");
    }

    // 1. Logique de détection de fuite
    const is_leak_alert = pressure < 2.5 && flow_rate > 5.0; 

    // 2. Insertion des données dans la base
    const { error } = await supabaseClient
      .from('hydraulic_measurements')
      .insert([
        { 
          flow_rate: flow_rate, 
          pressure: pressure, 
          temperature: temperature || 18.5, 
          is_leak_alert: is_leak_alert 
        }
      ])

    if (error) throw error

    // ==========================================
    // 3. ENVOI DE L'EMAIL D'ALERTE AU CLIENT
    // ==========================================
    if (is_leak_alert) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const clientEmail = Deno.env.get('CLIENT_EMAIL');

      if (resendApiKey && clientEmail) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'AquaPredict Alertes <onboarding@resend.dev>', // Email autorisé par défaut par Resend
            to: clientEmail,
            subject: '🚨 ALERTE CRITIQUE : Anomalie détectée sur le réseau d\'eau',
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0;">⚠️ Alerte de Fuite Physique</h2>
                </div>
                <div style="padding: 20px; background-color: #f8fafc; color: #333;">
                  <p>Bonjour,</p>
                  <p>Le système <strong>AquaPredict Analytics</strong> vient de détecter une chute de pression anormale indiquant une possible rupture ou fuite majeure sur votre réseau.</p>
                  
                  <h3 style="border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">Détails de l'anomalie :</h3>
                  <ul>
                    <li><strong>Tronçon suspecté :</strong> ${idTroncon || 'TR-Z1-042 (Défaut)'}</li>
                    <li><strong>Pression actuelle :</strong> <span style="color: #ef4444; font-weight: bold;">${pressure} bar</span> <em>(Seuil d'alerte: < 2.5 bar)</em></li>
                    <li><strong>Débit mesuré :</strong> ${flow_rate} L/min</li>
                    <li><strong>Heure de détection :</strong> ${new Date().toLocaleString('fr-FR')}</li>
                  </ul>
                  
                  <p style="margin-top: 30px;">Veuillez dépêcher une équipe technique pour une inspection acoustique du tronçon prioritaire.</p>
                  <br/>
                  <p><em>Plateforme AquaPredict SCADA</em></p>
                </div>
              </div>
            `
          })
        });

        if (!emailResponse.ok) {
          console.error("Erreur lors de l'envoi de l'email :", await emailResponse.text());
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Données enregistrées.",
        alert_triggered: is_leak_alert 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})