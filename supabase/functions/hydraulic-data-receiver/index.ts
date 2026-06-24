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

    // 1. APPEL À VOTRE API ML EXTERNE (qui charge les fichiers .pkl)
    // Remplacez l'URL par l'adresse de votre API déployée
    const mlResponse = await fetch('https://votre-api-ml.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pressure: pressure, 
        flow_rate: flow_rate, 
        temperature: temperature || 18.5 
      })
    });

    const mlData = await mlResponse.json();
    const leak_probability = mlData.probability; // Score entre 0 et 1

    // 2. LOGIQUE DÉCISIONNELLE (Alerte si > 70% de probabilité)
    const is_leak_alert = leak_probability > 0.7;

    // 3. Insertion des données dans la base avec la probabilité
    const { error } = await supabaseClient
      .from('hydraulic_measurements')
      .insert([
        { 
          flow_rate: flow_rate, 
          pressure: pressure, 
          temperature: temperature || 18.5, 
          is_leak_alert: is_leak_alert,
          leak_probability: leak_probability // Enregistrement du score du modèle
        }
      ])

    if (error) throw error

    // ==========================================
    // 4. ENVOI DE L'EMAIL D'ALERTE (SI ALERTE)
    // ==========================================
    if (is_leak_alert) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const clientEmail = Deno.env.get('CLIENT_EMAIL');

      if (resendApiKey && clientEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'AquaPredict Alertes <onboarding@resend.dev>',
            to: clientEmail,
            subject: '🚨 ALERTE : Risque de fuite détecté par IA',
            html: `
              <h2>Alerte de Fuite (Probabilité : ${(leak_probability * 100).toFixed(0)}%)</h2>
              <p>Tronçon: ${idTroncon || 'TR-Z1-042'}</p>
              <p>Le système a détecté un risque élevé basé sur les paramètres hydrauliques.</p>
            `
          })
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leak_probability: leak_probability,
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