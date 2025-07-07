
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const goalEmojis = ['🎯', '🏆', '⭐', '💎', '🚀', '🌟', '💫', '🎉', '🏅', '👑'];

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoalForm = ({ isOpen, onClose }: GoalFormProps) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) {
      toast({
        title: "Ops! 😅",
        description: "Preencha todos os campos para criar sua meta",
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

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(targetAmount),
        deadline,
        emoji: selectedEmoji,
        current_amount: 0
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar meta",
        description: "Tente novamente",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Meta criada! 🎉",
        description: "Agora é só correr atrás do seu sonho!",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setName('');
      setTargetAmount('');
      setDeadline('');
      setSelectedEmoji('🎯');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Nova Meta 🎯
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nome da Meta ✨
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem para a praia"
              className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label htmlFor="targetAmount" className="text-sm font-medium text-gray-700">
              Valor da Meta (R$) 💰
            </Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="1000,00"
              className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
              Data Limite 📅
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Escolha um emoji para sua meta 🎨
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {goalEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all hover:scale-110 ${
                    selectedEmoji === emoji 
                      ? 'border-green-500 bg-green-50 shadow-lg' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
            >
              {loading ? 'Criando...' : 'Criar Meta 🚀'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalForm;
