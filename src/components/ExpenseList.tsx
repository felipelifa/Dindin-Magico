
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  emoji: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  showDeleteButton?: boolean;
}

const categoryColors = {
  alimentacao: 'bg-orange-100 text-orange-800 border-orange-300',
  transporte: 'bg-blue-100 text-blue-800 border-blue-300',
  lazer: 'bg-purple-100 text-purple-800 border-purple-300',
  saude: 'bg-red-100 text-red-800 border-red-300',
  educacao: 'bg-green-100 text-green-800 border-green-300',
  roupas: 'bg-pink-100 text-pink-800 border-pink-300',
  casa: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  outros: 'bg-gray-100 text-gray-800 border-gray-300'
};

const ExpenseList = ({ expenses, showDeleteButton = false }: ExpenseListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast({
        title: "Erro ao deletar gasto",
        description: "Tente novamente",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Gasto deletado! 🗑️",
        description: "O gasto foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">📝 Nenhum gasto registrado ainda</p>
        <p className="text-sm mt-2">Comece registrando seus gastos para ter controle total!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id} className="border-0 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{expense.emoji}</div>
                <div>
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={categoryColors[expense.category as keyof typeof categoryColors] || categoryColors.outros}>
                      {expense.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    -R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {showDeleteButton && (
                  <Button
                    onClick={() => handleDeleteExpense(expense.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExpenseList;
