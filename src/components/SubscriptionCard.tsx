
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const SubscriptionCard = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-subscription', {
        body: { planType }
      });

      if (error) throw error;

      // Redirecionar para o Mercado Pago
      if (data.initPoint) {
        window.open(data.initPoint, '_blank');
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para o Mercado Pago"
        });
      }

    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast({
        title: "Erro ao processar assinatura",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'authorized':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" />Ativa</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">Inativa</Badge>;
    }
  };

  const isPremium = profile?.is_premium || subscription?.status === 'approved' || subscription?.status === 'authorized';

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Crown className="w-6 h-6 mr-2 text-yellow-500" />
          Plano Premium
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPremium ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {getStatusBadge(subscription?.status || 'active')}
            </div>
            <p className="text-green-600 font-medium">🎉 Você é Premium!</p>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">Benefícios ativos:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Notas de voz ilimitadas</li>
                <li>✅ Relatórios avançados</li>
                <li>✅ Metas personalizadas</li>
                <li>✅ Suporte prioritário</li>
              </ul>
            </div>
            {subscription?.expires_at && (
              <p className="text-xs text-gray-500">
                Expira em: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Desbloqueie recursos premium e turbine seu controle financeiro!
              </p>
            </div>

            <div className="grid gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">Plano Mensal</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">R$ 9,90</p>
                    <p className="text-xs text-gray-500">/mês</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? "Processando..." : "Assinar Mensal"}
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-purple-400 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500">Economize 17%</Badge>
                </div>
                <div className="flex justify-between items-center mb-3 mt-2">
                  <h3 className="font-bold text-lg">Plano Anual</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">R$ 99,90</p>
                    <p className="text-xs text-gray-500">/ano</p>
                    <p className="text-xs text-green-600">~R$ 8,33/mês</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSubscribe('annual')}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? "Processando..." : "Assinar Anual"}
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">O que você terá:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🎤 Notas de voz ilimitadas</li>
                <li>📊 Relatórios detalhados</li>
                <li>🎯 Metas avançadas</li>
                <li>💎 Interface premium</li>
                <li>🚀 Suporte prioritário</li>
                <li>📱 Acesso a novos recursos</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
