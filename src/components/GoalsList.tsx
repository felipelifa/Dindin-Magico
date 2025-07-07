
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  emoji: string;
}

interface GoalsListProps {
  goals: Goal[];
}

const GoalsList = ({ goals }: GoalsListProps) => {
  const [addingToGoal, setAddingToGoal] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddMoney = async (goalId: string, currentAmount: number) => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast({
        title: "Ops! 😅",
        description: "Digite um valor válido",
        variant: "destructive"
      });
      return;
    }

    const newAmount = currentAmount + parseFloat(addAmount);
    
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Dinheiro adicionado! 🎉",
        description: "Você está cada vez mais perto do seu objetivo!",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setAddingToGoal(null);
      setAddAmount('');
    }
  };

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">🎯 Nenhuma meta criada ainda</p>
        <p className="text-sm mt-2">Que tal definir um objetivo e começar a realizá-lo?</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const isCompleted = progress >= 100;
        const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <Card key={goal.id} className={`border-0 ${isCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-white'} hover:shadow-md transition-all`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{goal.emoji}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                    <p className="text-sm text-gray-600">
                      {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'} • {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {isCompleted && <div className="text-2xl">🎉</div>}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span>R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <Progress 
                  value={Math.min(progress, 100)} 
                  className="h-3 bg-gray-200"
                />
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>
                    {isCompleted ? 'Meta conquistada! 🏆' : `${progress.toFixed(1)}% concluído`}
                  </span>
                  
                  {!isCompleted && (
                    <div className="flex items-center space-x-2">
                      {addingToGoal === goal.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={addAmount}
                            onChange={(e) => setAddAmount(e.target.value)}
                            className="w-24 h-8 text-sm border-gray-200 focus:border-green-500"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddMoney(goal.id, goal.current_amount)}
                            className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingToGoal(null);
                              setAddAmount('');
                            }}
                            className="h-8 px-3 border-gray-300"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setAddingToGoal(goal.id)}
                          className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalsList;
