import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Se quiser trocar por Bootstrap puro, troque Card, CardContent, CardHeader, CardTitle por divs.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Se quiser trocar por Bootstrap puro, troque Button por <button> ou <a> e use className do Bootstrap.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import VoiceRecorder from '@/components/VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import FixedExpensesList from '@/components/FixedExpensesList';
import CalendarFinanceiro from '@/components/CalendarFinanceiro';

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
  const [gastosFiltro, setGastosFiltro] = useState('todos');
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
  const categoriasUnicas = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

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

  // ================= GASTOS ===================
  // Filtra os gastos variáveis do mês atual
  const now = new Date();
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });
  // Valor dos gastos variáveis do mês
  const gastosVariaveisMes = thisMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  // Valor dos gastos fixos cadastrados
  const gastosFixosMes = fixedExpenses.reduce((sum, fx) => sum + Number(fx.amount), 0);
  // Soma dos dois
  const gastosMes = gastosVariaveisMes + gastosFixosMes;

  // Função de filtro para mostrar o valor correto
  const getGastosValor = () => {
    if (gastosFiltro === 'fixos') return gastosFixosMes;
    if (gastosFiltro === 'variaveis') return gastosVariaveisMes;
    return gastosMes;
  };

  // ================= RESTANTE =================

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthBudget = monthlyBudgets.find(budget =>
    budget.month === currentMonth && budget.year === currentYear
  );
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
      <div className="d-flex min-vh-100 justify-content-center align-items-center bg-light p-4">
        <div className="card w-100" style={{ maxWidth: 480 }}>
          <div className="card-header text-center pb-4">
            <div className="mx-auto rounded-circle bg-success d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
              <PiggyBank className="w-50 h-50 text-white" />
            </div>
            <h2 className="card-title mb-2 fw-bold text-primary">DinDinMágico ✨</h2>
            <p className="text-secondary">Seu anjo da guarda financeiro chegou! 💰</p>
          </div>
          <div className="card-body">
            {!showAuth ? (
              <>
                <div className="text-center mb-4">
                  <p className="mb-1">🎯 Transforme sonhos em realidade</p>
                  <p className="mb-1">🏆 Celebre cada conquista</p>
                  <p className="mb-3">📱 Simples e divertido</p>
                </div>
                <Button
                  onClick={() => setShowAuth(true)}
                  className="btn btn-success w-100 mb-2"
                >
                  <Sparkles className="me-2" />
                  Começar a Jornada Mágica
                </Button>
              </>
            ) : (
              <form onSubmit={handleAuth}>
                <div className="d-flex gap-2 mb-3">
                  <Button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-fill btn ${isLogin ? 'btn-primary' : 'btn-outline-primary'}`}
                  >
                    Entrar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-fill btn ${!isLogin ? 'btn-primary' : 'btn-outline-primary'}`}
                  >
                    Cadastrar
                  </Button>
                </div>
                <Input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-control mb-2"
                  required
                />
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-control mb-3"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success w-100 mb-2"
                >
                  {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar Conta")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="btn btn-link w-100"
                >
                  Voltar
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container-lg">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12 bg-white rounded shadow-sm p-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div>
              <h1 className="h3 fw-bold text-primary mb-0">DinDinMágico ✨</h1>
              <p className="text-secondary mb-0">{getMotivationalMessage()}</p>
            </div>
            <div className="mt-3 mt-md-0 d-flex gap-2">
              <Button
                onClick={() => window.location.href = '/settings'}
                className="btn btn-outline-secondary"
              >
                <Settings className="me-2" />
                Configurações
              </Button>
              <Button
                onClick={handleSignOut}
                className="btn btn-outline-danger"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          {/* Economia do mês */}
          <div className="col-md-4">
            <div className="card text-white bg-success mb-3 shadow">
              <div className="card-header d-flex align-items-center">
                <PiggyBank className="me-2" />
                {currentMonthBudget ? 'Economia do Mês' : 'Sem Orçamento'}
              </div>
              <div className="card-body">
                {currentMonthBudget ? (
                  <>
                    <h3 className="card-title">R$ {economiaDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <p className="card-text">
                      {economiaDoMes > 0
                        ? 'Você está economizando! 🎉'
                        : 'Defina um orçamento para economizar! 💪'}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="card-title">--</h3>
                    <p className="card-text">Defina um orçamento mensal! 📊</p>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Gastos do mês */}
          <div className="col-md-4">
            <div className="card text-white bg-primary mb-3 shadow">
              <div className="card-header d-flex align-items-center">
                <TrendingUp className="me-2" />
                Gastos do Mês
              </div>
              <div className="card-body">
                {/* Botões de filtro */}
                <div className="btn-group mb-2 w-100" role="group">
                  <Button
                    size="sm"
                    className={`btn ${gastosFiltro === 'todos' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setGastosFiltro('todos')}
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    className={`btn ${gastosFiltro === 'variaveis' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setGastosFiltro('variaveis')}
                  >
                    Normais
                  </Button>
                  <Button
                    size="sm"
                    className={`btn ${gastosFiltro === 'fixos' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                    onClick={() => setGastosFiltro('fixos')}
                  >
                    Fixos
                  </Button>
                </div>
                <h3 className="card-title">
                  R$ {getGastosValor().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="card-text">
                  {gastosFiltro === 'fixos'
                    ? 'Gastos fixos deste mês 💡'
                    : gastosFiltro === 'variaveis'
                      ? 'Gastos normais do mês 🔄'
                      : 'Continue assim! 💪'}
                </p>
              </div>
            </div>
          </div>
          {/* Metas ativas */}
          <div className="col-md-4">
            <div className="card text-white bg-purple mb-3 shadow" style={{ background: '#8e44ad' }}>
              <div className="card-header d-flex align-items-center">
                <Target className="me-2" />
                Metas Ativas
              </div>
              <div className="card-body">
                <h3 className="card-title">{goals.length}</h3>
                <p className="card-text">Sonhos em andamento! ⭐</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendário Financeiro */}
        <CalendarFinanceiro expenses={expenses} user={user} categories={categoriasUnicas} />

        {/* Quick Actions */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-2">
            <Button
              onClick={() => setShowVoiceRecorder(true)}
              className="btn btn-outline-primary w-100"
            >
              <Mic className="me-2" />
              Anotação por voz 🎤
            </Button>
          </div>
          <div className="col-6 col-md-2">
            <Button
              onClick={() => setShowFixedExpensesModal(true)}
              className="btn btn-outline-info w-100"
            >
              <span className="me-2">💳</span>
              Gastos Fixos
            </Button>
          </div>
          <div className="col-6 col-md-2">
            <Button
              onClick={() => setShowExpenseForm(true)}
              className="btn btn-outline-danger w-100"
            >
              <Plus className="me-2" />
              Novo Gasto 💸
            </Button>
          </div>
          <div className="col-6 col-md-2">
            <Button
              onClick={() => setShowGoalForm(true)}
              className="btn btn-outline-success w-100"
            >
              <Target className="me-2" />
              Nova Meta 🎯
            </Button>
          </div>
          <div className="col-6 col-md-2">
            <Button
              onClick={() => setShowBudgetForm(true)}
              className="btn btn-outline-secondary w-100"
            >
              <Calendar className="me-2" />
              Orçamento Mensal 📊
            </Button>
          </div>
          <div className="col-6 col-md-2">
            <Button
              className="btn btn-warning w-100"
              onClick={() => {
                setCelebrationMessage("Você é incrível! Continue assim! 🎉✨");
                setShowCelebration(true);
              }}
            >
              <Sparkles className="me-2" />
              Me Motiva! ⚡
            </Button>
          </div>
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
          <div className="card mb-4 shadow">
            <div className="card-header d-flex align-items-center">
              <Target className="me-2 text-success" />
              Suas Metas 🎯
            </div>
            <div className="card-body">
              <GoalsList goals={goals} />
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <div className="card mb-4 shadow">
            <div className="card-header d-flex align-items-center">
              <TrendingUp className="me-2 text-primary" />
              Últimos Gastos 📊
            </div>
            <div className="card-body">
              <ExpenseList expenses={expenses.slice(0, 5)} showDeleteButton={true} />
            </div>
          </div>
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
