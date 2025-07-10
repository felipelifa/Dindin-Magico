import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FixedExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    name?: string;
    amount?: number;
    category?: string;
    due_day?: number;
  };
}

const FixedExpenseForm = ({ isOpen, onClose, initialData }: FixedExpenseFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [dueDay, setDueDay] = useState(initialData?.due_day || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      let response;
      if (initialData?.id) {
        // Editar
        response = await supabase
          .from('fixed_expenses')
          .update({
            name,
            amount: Number(amount),
            category,
            due_day: Number(dueDay)
          })
          .eq('id', initialData.id);
      } else {
        // Adicionar novo
        response = await supabase
          .from('fixed_expenses')
          .insert({
            user_id: user.id,
            name,
            amount: Number(amount),
            category,
            due_day: Number(dueDay)
          });
      }
      if (response.error) throw response.error;

      toast({ title: "Gasto fixo salvo!" });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      onClose();
      setName('');
      setAmount('');
      setCategory('');
      setDueDay('');
    } catch (err: any) {
      toast({ title: "Erro!", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {initialData?.id ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <Input
            placeholder="Nome (ex: Aluguel)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            placeholder="Valor"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(',', '.'))}
            type="number"
            required
          />
          <Input
            placeholder="Categoria (ex: Moradia, Internet...)"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
          <Input
            placeholder="Dia do vencimento (ex: 10)"
            value={dueDay}
            onChange={e => setDueDay(e.target.value.replace(/\D/, ''))}
            type="number"
            min={1}
            max={31}
            required
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FixedExpenseForm;
