import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Target, TrendingUp, Sparkles, Plus, Mic, Calendar, Settings } from 'lucide-react';
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
import { useNavigate } from "react-router-dom"; // <-- Importação do hook

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
  const { toast } = useToast();

  const navigate = useNavigate(); // <-- Inicialização do hook

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

  // ... (outros hooks de query, funções auxiliares e handleAuth...)

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  if (!user) {
    // ... (Tela de login igual)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              DinDinMágico ✨
            </h1>
            <p className="text-gray-600 mt-1">{getMotivationalMessage()}</p>
          </div>
          <div className="flex gap-3">
            {/* BOTÃO MODIFICADO */}
            <Button 
              onClick={() => navigate('/settings')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* ...o resto do seu JSX (cards, actions, modais etc) */}
        {/* ...sem mudanças */}
      </div>
    </div>
  );
};

export default Index;
