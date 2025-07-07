
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingDown, Edit } from 'lucide-react';

interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  budget_amount: number;
  created_at: string;
  updated_at: string;
}

interface MonthlyBudgetCardProps {
  budget: MonthlyBudget;
  currentSpent: number;
  onEdit: () => void;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MonthlyBudgetCard = ({ budget, currentSpent, onEdit }: MonthlyBudgetCardProps) => {
  const budgetAmount = Number(budget.budget_amount);
  const spentPercentage = budgetAmount > 0 ? (currentSpent / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - currentSpent;
  const isOverBudget = currentSpent > budgetAmount;

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-red-500';
    if (spentPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = () => {
    if (isOverBudget) {
      return `Você estourou o orçamento em R$ ${(currentSpent - budgetAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 😰`;
    }
    if (spentPercentage >= 80) {
      return `Atenção! Restam apenas R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ⚠️`;
    }
    return `Você está indo bem! Ainda restam R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 😊`;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            {monthNames[budget.month - 1]} {budget.year}
          </CardTitle>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Orçamento:</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            R$ {budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Gasto:</span>
          </div>
          <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
            R$ {currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Progresso</span>
            <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
              {Math.min(spentPercentage, 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(spentPercentage, 100)} 
            className="h-2"
          />
        </div>

        <div className={`text-sm p-3 rounded-lg ${
          isOverBudget 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : spentPercentage >= 80 
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {getStatusMessage()}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyBudgetCard;
