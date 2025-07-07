
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Settings as SettingsIcon } from 'lucide-react';
import SubscriptionCard from '@/components/SubscriptionCard';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    
    if (payment === 'success') {
      toast({
        title: "Pagamento aprovado! 🎉",
        description: "Sua assinatura foi ativada com sucesso!"
      });
    } else if (payment === 'failure') {
      toast({
        title: "Pagamento não aprovado",
        description: "Tente novamente ou entre em contato conosco",
        variant: "destructive"
      });
    } else if (payment === 'pending') {
      toast({
        title: "Pagamento pendente",
        description: "Aguardando confirmação do pagamento"
      });
    }
  }, [toast]);

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-gray-600 mt-1">Gerencie sua conta e preferências</p>
            </div>
          </div>
          <SettingsIcon className="w-8 h-8 text-gray-400" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Perfil do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {loading ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Sair
                  </Button>
                </div>
              </form>

              {profile && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações da Conta:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Status: {profile.is_premium ? '👑 Premium' : '🆓 Gratuito'}</p>
                    <p>Membro desde: {new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
                    {profile.trial_end_date && (
                      <p>Período gratuito até: {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <SubscriptionCard />
        </div>
      </div>
    </div>
  );
};

export default Settings;
