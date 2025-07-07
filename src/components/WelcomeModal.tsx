
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, PiggyBank, Target, TrendingUp } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Bem-vindo ao DinDinMágico! ✨
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <p className="text-center text-gray-700 text-lg">
            Seu anjo da guarda financeiro chegou! 💰
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
              <PiggyBank className="w-6 h-6 text-green-600" />
              <span className="text-gray-700">Controle seus gastos de forma divertida</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
              <Target className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">Defina metas e realize seus sonhos</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className="text-gray-700">Celebrate cada conquista!</span>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
            <p className="text-yellow-800 text-sm text-center">
              🎉 <strong>Você está em período de teste!</strong><br/>
              Aproveite todos os recursos por 3 dias gratuitamente!
            </p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
          >
            Vamos começar! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
