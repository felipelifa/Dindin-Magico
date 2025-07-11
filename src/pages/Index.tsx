import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Target, TrendingUp, Sparkles, Plus, Mic, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ExpenseForm from '@/components/ExpenseForm';
import GoalForm from '@/components/GoalForm';
import ExpenseList from '@/components/ExpenseList';
import GoalsList from '@/components/GoalsList';
import WelcomeModal from '@/components/WelcomeModal';
import CelebrationModal from '@/components/CelebrationModal';
import MonthlyBudgetForm from '@/components/MonthlyBudgetForm';
import MonthlyBudgetCard from '@/components/MonthlyBudgetCard';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import VoiceRecorder from '@/components/VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import FixedExpensesList from '@/components/FixedExpensesList';
import { CreditCard } from 'lucide-react';


const Index = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFixedExpensesModal, setShowFixedExpensesModal] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile && new Date(profile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
              setShowWelcome(true);
            }
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: monthlyBudgets = [] } = useQuery({
    queryKey: ['monthly_budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
const { data: fixedExpenses = [] } = useQuery({
  queryKey: ['fixed_expenses', user?.id],
  queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', user.id);
    if (error) throw error;
    return data;
  },
  enabled: !!user
});

  const totalGastos = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  // Somatório dos gastos variáveis do mês
const gastosVariaveisMes = thisMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

// Somatório dos gastos fixos cadastrados
const gastosFixosMes = fixedExpenses.reduce((sum, fx) => sum + Number(fx.amount), 0);

// Soma dos dois
const gastosMes = gastosVariaveisMes + gastosFixosMes;


  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthBudget = monthlyBudgets.find(budget => 
    budget.month === currentMonth && budget.year === currentYear
  );

  // Calcular economia (diferença entre orçamento e gastos)
  const economiaDoMes = currentMonthBudget 
    ? Math.max(0, Number(currentMonthBudget.budget_amount) - gastosMes)
    : 0;

  const getMotivationalMessage = () => {
    const messages = [
      "Você está no caminho certo! 🌟",
      "Cada real economizado é um passo para seus sonhos! 💫",
      "Sua dedicação está dando frutos! 🎉",
      "Continue assim, você é incrível! ⭐",
      "Seus objetivos estão cada vez mais perto! 🚀"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta! 🎉"
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta 📧"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              DinDinMágico ✨
            </CardTitle>
            <p className="text-lg text-gray-600 mt-2">
              Seu anjo da guarda financeiro chegou! 💰
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showAuth ? (
              <>
                <div className="text-center space-y-3">
                  <p className="text-gray-700">🎯 Transforme sonhos em realidade</p>
                  <p className="text-gray-700">🏆 Celebre cada conquista</p>
                  <p className="text-gray-700">📱 Simples e divertido</p>
                </div>
                <Button 
                  onClick={() => setShowAuth(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Começar a Jornada Mágica
                </Button>
              </>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    variant={isLogin ? "default" : "outline"}
                    className="flex-1"
                  >
                    Entrar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    variant={!isLogin ? "default" : "outline"}
                    className="flex-1"
                  >
                    Cadastrar
                  </Button>
                </div>
                
                <Input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar Conta")}
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Voltar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
      DinDinMágico ✨
    </h1>
    <p className="text-gray-600 mt-1">{getMotivationalMessage()}</p>
  </div>
  <div className="flex gap-2 justify-end">
    <Button
      onClick={() => window.location.href = '/settings'}
      variant="outline"
      className="border-gray-300 hover:bg-gray-50 min-w-[100px] py-1 px-2 text-xs sm:text-base"
    >
      <Settings className="w-4 h-4 mr-1" />
      Configurações
    </Button>
    <Button
      onClick={handleSignOut}
      variant="outline"
      className="border-gray-300 hover:bg-gray-50 min-w-[60px] py-1 px-2 text-xs sm:text-base"
    >
      Sair
    </Button>
  </div>
</div>


        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <PiggyBank className="w-6 h-6 mr-2" />
                {currentMonthBudget ? 'Economia do Mês' : 'Sem Orçamento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMonthBudget ? (
                <>
                  <p className="text-3xl font-bold">R$ {economiaDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-green-100 mt-1">
                    {economiaDoMes > 0 ? 'Você está economizando! 🎉' : 'Defina um orçamento para economizar! 💪'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-green-100 mt-1">Defina um orçamento mensal! 📊</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-6 h-6 mr-2" />
                Gastos do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {gastosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-blue-100 mt-1">Continue assim! 💪</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="w-6 h-6 mr-2" />
                Metas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{goals.length}</p>
              <p className="text-purple-100 mt-1">Sonhos em andamento! ⭐</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
  <Button
    onClick={() => setShowVoiceRecorder(true)}
    className="h-16 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
  >
    <Mic className="w-6 h-6 mr-2" />
    Anotação por voz 🎤
  </Button>

  <Button
    onClick={() => setShowFixedExpensesModal(true)}
    className="h-16 bg-gradient-to-r from-cyan-500 to-blue-400 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
  >
    {/* Você pode trocar o ícone se quiser */}
    <span className="mr-2">💳</span>
    Gastos Fixos
  </Button>

  <Button
    onClick={() => setShowExpenseForm(true)}
    className="h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
  >
    <Plus className="w-6 h-6 mr-2" />
    Novo Gasto 💸
  </Button>

  <Button
    onClick={() => setShowGoalForm(true)}
    className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
  >
    <Target className="w-6 h-6 mr-2" />
    Nova Meta 🎯
  </Button>

  <Button
    onClick={() => setShowBudgetForm(true)}
    className="h-16 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
  >
    <Calendar className="w-6 h-6 mr-2" />
    Orçamento Mensal 📊
  </Button>

  <Button
    className="h-16 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
    onClick={() => {
      setCelebrationMessage("Você é incrível! Continue assim! 🎉✨");
      setShowCelebration(true);
    }}
  >
    <Sparkles className="w-6 h-6 mr-2" />
    Me Motiva! ⚡
  </Button>
</div>

        {/* Monthly Budget Section */}
        {currentMonthBudget && (
          <MonthlyBudgetCard 
            budget={currentMonthBudget}
            currentSpent={gastosMes}
            onEdit={() => setShowBudgetForm(true)}
          />
        )}

        {/* Goals Progress */}
        {goals.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="w-6 h-6 mr-2 text-green-600" />
                Suas Metas 🎯
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsList goals={goals} />
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                Últimos Gastos 📊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseList expenses={expenses.slice(0, 5)} showDeleteButton={true} />
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <ExpenseForm 
          isOpen={showExpenseForm} 
          onClose={() => setShowExpenseForm(false)} 
        />
        <GoalForm 
          isOpen={showGoalForm} 
          onClose={() => setShowGoalForm(false)} 
        />
        <MonthlyBudgetForm 
          isOpen={showBudgetForm} 
          onClose={() => setShowBudgetForm(false)} 
        />
        <VoiceRecorder
          isOpen={showVoiceRecorder}
          onClose={() => setShowVoiceRecorder(false)}
        />
        <WelcomeModal 
          isOpen={showWelcome} 
          onClose={() => setShowWelcome(false)} 
        />
        <CelebrationModal 
          isOpen={showCelebration} 
          onClose={() => setShowCelebration(false)}
          message={celebrationMessage}
        />
        <FixedExpensesList
  isOpen={showFixedExpensesModal}
  onClose={() => setShowFixedExpensesModal(false)}
/>

      </div>
    </div>
  );
};

export default Index;
