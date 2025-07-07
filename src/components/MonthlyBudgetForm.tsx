
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface MonthlyBudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

const MonthlyBudgetForm = ({ isOpen, onClose }: MonthlyBudgetFormProps) => {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingBudget, setExistingBudget] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  // Definir valores padrão quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(currentMonth.toString());
      setSelectedYear(currentYear.toString());
      setBudgetAmount('');
      setExistingBudget(null);
      checkExistingBudget(currentMonth, currentYear);
    }
  }, [isOpen, currentMonth, currentYear]);

  // Verificar orçamento existente quando mês/ano mudarem
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      checkExistingBudget(parseInt(selectedMonth), parseInt(selectedYear));
    }
  }, [selectedMonth, selectedYear]);

  const checkExistingBudget = async (month: number, year: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar orçamento:', error);
        return;
      }

      if (data) {
        setExistingBudget(data);
        setBudgetAmount(data.budget_amount.toString());
      } else {
        setExistingBudget(null);
        setBudgetAmount('');
      }
    } catch (error) {
      console.error('Erro ao verificar orçamento existente:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetAmount || !selectedMonth || !selectedYear) {
      toast({
        title: "Ops! 😅",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido! 💸",
        description: "Digite um valor válido maior que zero",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const budgetData = {
        user_id: user.id,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        budget_amount: amount,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('monthly_budgets')
        .upsert(budgetData, { 
          onConflict: 'user_id,month,year',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      const monthName = months.find(m => m.value === parseInt(selectedMonth))?.label;
      const actionText = existingBudget ? 'atualizado' : 'definido';
      
      toast({
        title: `Orçamento ${actionText}! 🎯`,
        description: `Meta para ${monthName}/${selectedYear}: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
      
      // Invalidar as queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      
      // Fechar o modal
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: "Erro ao salvar orçamento",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {existingBudget ? 'Editar Orçamento 📝' : 'Meta Mensal 🎯'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="budgetAmount" className="text-sm font-medium text-gray-700">
              Valor do Orçamento (R$) 💰
            </Label>
            <Input
              id="budgetAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="Ex: 1500.00"
              className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
              required
            />
            {existingBudget && (
              <p className="text-xs text-green-600 mt-1">
                Orçamento atual: R$ {existingBudget.budget_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="month" className="text-sm font-medium text-gray-700">
              Mês 📅
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth} required>
              <SelectTrigger className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl">
                <SelectValue placeholder="Escolha o mês" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg rounded-xl">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="year" className="text-sm font-medium text-gray-700">
              Ano 🗓️
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear} required>
              <SelectTrigger className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl">
                <SelectValue placeholder="Escolha o ano" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg rounded-xl">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !budgetAmount || !selectedMonth || !selectedYear}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl disabled:opacity-50"
            >
              {loading ? 'Salvando...' : existingBudget ? 'Atualizar 📝' : 'Definir Meta 🎯'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyBudgetForm;
