
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const categories = [
  { value: 'alimentacao', label: 'Alimentação 🍕', emoji: '🍕' },
  { value: 'transporte', label: 'Transporte 🚗', emoji: '🚗' },
  { value: 'lazer', label: 'Lazer 🎉', emoji: '🎉' },
  { value: 'saude', label: 'Saúde 🏥', emoji: '🏥' },
  { value: 'educacao', label: 'Educação 📚', emoji: '📚' },
  { value: 'roupas', label: 'Roupas 👕', emoji: '👕' },
  { value: 'casa', label: 'Casa 🏠', emoji: '🏠' },
  { value: 'outros', label: 'Outros 📝', emoji: '📝' }
];

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseForm = ({ isOpen, onClose }: ExpenseFormProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) {
      toast({
        title: "Ops! 😅",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const selectedCategory = categories.find(cat => cat.value === category);
    
    const { error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        description,
        category,
        date,
        emoji: selectedCategory?.emoji || '💰'
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao salvar gasto",
        description: "Tente novamente",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Gasto registrado! 🎉",
        description: "Que tal definir uma meta para economizar?",
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Novo Gasto 💸
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Valor (R$) 💰
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição 📝
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço no restaurante"
              className="mt-1 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoria 🏷️
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl">
                <SelectValue placeholder="Escolha uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Data 📅
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl"
            >
              {loading ? 'Salvando...' : 'Salvar Gasto 💾'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
