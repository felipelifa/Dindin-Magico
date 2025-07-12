import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CalendarFinanceiro({ expenses, user, categories }) {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedDate, setSelectedDate] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtra gastos do mês por categoria
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'todos') return expenses;
    return expenses.filter(g => g.category === selectedCategory);
  }, [expenses, selectedCategory]);

  // Agrupa gastos por data
  const expensesByDate = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(exp => {
      const dateStr = new Date(exp.date).toISOString().split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(exp);
    });
    return map;
  }, [filteredExpenses]);

  // Carrega anotação do dia
  async function handleDayClick(date) {
    setSelectedDate(date);
    if (!user) return;
    const { data, error } = await supabase
      .from('daily_notes')
      .select('note')
      .eq('user_id', user.id)
      .eq('date', date.toISOString().split('T')[0])
      .single();
    setNote(data?.note || '');
  }

  // Salva anotação do dia
  async function handleSaveNote() {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { error: upsertError } = await supabase
        .from('daily_notes')
        .upsert([{
          user_id: user.id,
          date: dateStr,
          note
        }], { onConflict: ['user_id', 'date'] });
      if (upsertError) throw upsertError;
      toast({ title: 'Anotação salva!' });
      setSelectedDate(null);
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/70 rounded-2xl shadow-lg p-6 my-8">
      <div className="flex flex-col sm:flex-row items-center mb-4 gap-3">
        <h2 className="text-lg font-bold flex-1">Calendário de Gastos</h2>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="todos">Todas categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <Calendar
        locale="pt-BR"
        onClickDay={handleDayClick}
        tileContent={({ date }) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayExpenses = expensesByDate[dateStr] || [];
          // Um pontinho para cada categoria naquele dia
          return (
            <div className="flex gap-0.5 justify-center mt-1">
              {Array.from(new Set(dayExpenses.map(e => e.category))).map((cat, idx) => (
                <span
                  key={cat}
                  className={`w-2 h-2 rounded-full`}
                  style={{
                    background:
                      cat === 'Alimentação' ? '#22c55e'
                        : cat === 'Lazer' ? '#f59e42'
                        : cat === 'Contas' ? '#3b82f6'
                        : '#a78bfa'
                  }}
                ></span>
              ))}
            </div>
          );
        }}
        tileClassName={({ date }) => {
          // Destacar dias com gasto
          const dateStr = date.toISOString().split('T')[0];
          return expensesByDate[dateStr] ? "bg-blue-100 rounded-lg" : "";
        }}
      />

      {/* Modal de anotação */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Anotações de {selectedDate && selectedDate.toLocaleDateString('pt-BR')}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-2">
            <strong>Gastos do dia:</strong>
            <ul className="text-sm mt-1">
              {(selectedDate && expensesByDate[selectedDate.toISOString().split('T')[0]]) ? (
                expensesByDate[selectedDate.toISOString().split('T')[0]].map((g, i) => (
                  <li key={i}>
                    {g.name} - R$ {Number(g.amount).toFixed(2)} <span className="text-gray-400">({g.category})</span>
                  </li>
                ))
              ) : (
                <li>Nenhum gasto neste dia</li>
              )}
            </ul>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Digite sua anotação (opcional)..."
            className="w-full min-h-[60px] border rounded p-2 mb-3"
          />
          <Button className="w-full" onClick={handleSaveNote} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Anotação"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
