
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Webhook recebido:', body);

    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Se for notificação de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Buscar detalhes do pagamento no Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error(`Erro ao buscar pagamento: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Detalhes do pagamento:', payment);

      const userId = payment.external_reference;
      const status = payment.status;

      // Atualizar assinatura no banco
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: status,
          mercadopago_payment_id: paymentId,
          updated_at: new Date().toISOString(),
          expires_at: status === 'approved' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
            : null
        })
        .eq('user_id', userId)
        .eq('mercadopago_subscription_id', payment.preference_id);

      if (updateError) {
        console.error('Erro ao atualizar assinatura:', updateError);
        throw updateError;
      }

      console.log(`Assinatura atualizada para usuário ${userId} com status ${status}`);
    }

    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
