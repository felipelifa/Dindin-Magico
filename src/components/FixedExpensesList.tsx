import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FixedExpenseForm from './FixedExpenseForm';
import { Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FixedExpensesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: fixedExpenses = [], isLoading } = useQuery({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('due_day', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este gasto fixo?")) return;
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao excluir!", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gasto fixo excluído!" });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          Gastos Fixos
        </CardTitle>
        <Button onClick={() => { setEditData(null); setShowForm(true); }}>
          Novo Gasto Fixo +
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Carregando...</p>}
        {fixedExpenses.length === 0 && !isLoading && (
          <p className="text-gray-600">Nenhum gasto fixo cadastrado ainda.</p>
        )}
        {fixedExpenses.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between border-b py-2">
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="ml-2 text-gray-500">({item.category})</span>
              <span className="ml-4 text-blue-600 font-bold">
                R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="ml-4 text-xs text-gray-400">
                Vence dia {item.due_day}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditData(item); setShowForm(true); }}>
                <Edit className="w-4 h-4 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      <FixedExpenseForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        initialData={editData}
      />
    </Card>
  );
};

export default FixedExpensesList;
