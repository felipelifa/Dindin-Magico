
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { planType = 'monthly' } = await req.json();
    
    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Criar preference do Mercado Pago
    const preference = {
      items: [
        {
          title: planType === 'monthly' ? 'DinDinMágico - Plano Mensal' : 'DinDinMágico - Plano Anual',
          quantity: 1,
          unit_price: planType === 'monthly' ? 9.90 : 99.90,
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${req.headers.get('origin')}/settings?payment=success`,
        failure: `${req.headers.get('origin')}/settings?payment=failure`,
        pending: `${req.headers.get('origin')}/settings?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: user.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    console.log('Criando preference no Mercado Pago:', preference);

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do Mercado Pago:', errorText);
      throw new Error(`Erro do Mercado Pago: ${response.status}`);
    }

    const data = await response.json();
    console.log('Preference criada:', data);

    // Salvar assinatura no banco
    const { error: dbError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: planType,
        amount: planType === 'monthly' ? 9.90 : 99.90,
        status: 'pending',
        mercadopago_subscription_id: data.id,
      });

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
