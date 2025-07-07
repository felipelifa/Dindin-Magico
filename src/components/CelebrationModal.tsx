
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const celebrations = [
  "Você é incrível! Continue assim! 🎉✨",
  "Seus esforços estão dando frutos! 🌟💪",
  "Cada real economizado é uma vitória! 🏆💰",
  "Você está no caminho certo para a liberdade financeira! 🚀💎",
  "Sua dedicação é inspiradora! 🌈⭐",
  "Continue brilhando, você é demais! ✨🎊",
  "Suas metas estão cada vez mais próximas! 🎯🏅",
  "Você merece todas as conquistas! 👑💫"
];

const CelebrationModal = ({ isOpen, onClose, message }: CelebrationModalProps) => {
  const [currentMessage, setCurrentMessage] = useState(message);
  
  useEffect(() => {
    if (isOpen && !message) {
      const randomMessage = celebrations[Math.floor(Math.random() * celebrations.length)];
      setCurrentMessage(randomMessage);
    } else if (message) {
      setCurrentMessage(message);
    }
  }, [isOpen, message]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Motivação Especial! ⚡
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div className="text-center">
            <p className="text-xl font-medium text-gray-800 mb-4">
              {currentMessage}
            </p>
            
            <div className="text-6xl animate-bounce mb-4">
              🎉
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl p-4">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Lembre-se:</strong> Cada pequeno passo te leva mais perto dos seus sonhos! 
              O DinDinMágico está aqui para te apoiar sempre! 💪✨
            </p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Obrigado! Vou continuar! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationModal;
