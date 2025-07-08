
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceRecorder = ({ isOpen, onClose }: VoiceRecorderProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
        isHoldingRef.current = false;
      };

      recognitionRef.current.onend = () => {
        if (isHoldingRef.current) {
          recognitionRef.current?.start();
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Reconhecimento de voz não suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive"
      });
      return;
    }

    setIsListening(true);
    isHoldingRef.current = true;
    recognitionRef.current?.start();
    
    toast({
      title: "Gravação iniciada! 🎤",
      description: "Mantenha pressionado e fale..."
    });
  };

  const stopListening = () => {
    setIsListening(false);
    isHoldingRef.current = false;
    recognitionRef.current?.stop();
    
    if (transcript.trim()) {
      toast({
        title: "Gravação finalizada! ✅",
        description: "Agora você pode revisar e salvar"
      });
    }
  };

  const handleMouseDown = () => {
    startListening();
  };

  const handleMouseUp = () => {
    stopListening();
  };

  const handleTouchStart = () => {
    startListening();
  };

  const handleTouchEnd = () => {
    stopListening();
  };

  const saveExpenseFromTranscript = async () => {
    if (!transcript.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const text = transcript.toLowerCase();
      let amount = 0;
      let description = transcript;
      let category = 'outros';

      const amountMatch = text.match(/(?:r\$\s*)?(\d+(?:[,\.]\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', '.'));
      }

      if (text.includes('comida') || text.includes('almoço') || text.includes('jantar') || text.includes('restaurante')) {
        category = 'alimentacao';
      } else if (text.includes('uber') || text.includes('taxi') || text.includes('ônibus') || text.includes('transporte')) {
        category = 'transporte';
      } else if (text.includes('cinema') || text.includes('diversão') || text.includes('lazer')) {
        category = 'lazer';
      } else if (text.includes('farmácia') || text.includes('médico') || text.includes('saúde')) {
        category = 'saude';
      }

      if (amount > 0) {
        const { error } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            amount,
            description: `Nota de voz: ${description}`,
            category,
            date: new Date().toISOString().split('T')[0],
            emoji: '🎤'
          });

        if (error) throw error;

        toast({
          title: "Gasto salvo! 💰",
          description: `R$ ${amount.toFixed(2)} registrado com sucesso`
        });

        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        handleReset();
        onClose();
      } else {
        toast({
          title: "Valor não identificado",
          description: "Não consegui identificar o valor na nota de voz",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Erro ao salvar gasto",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setTranscript('');
    setIsListening(false);
    isHoldingRef.current = false;
    recognitionRef.current?.stop();
  };

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-red-600">
              Recurso Não Disponível
            </DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p className="text-gray-600 mb-4">
              Seu navegador não suporta reconhecimento de voz. 
              Tente usar Chrome, Safari ou Edge.
            </p>
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nota de Voz Gratuita 🎤
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {isListening ? "🔴 Gravando... Mantenha pressionado!" : "Pressione e segure o botão para gravar"}
            </p>
            
            <div className="flex gap-3">
              <Button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`${
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white rounded-full w-20 h-20 text-lg font-bold select-none`}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Pressione e segure para gravar sua nota de gasto
            </p>
          </div>

          {transcript && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Transcrição:</h4>
              <p className="text-sm text-gray-700 mb-4">{transcript}</p>
              
              <Button
                onClick={saveExpenseFromTranscript}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Salvar como Gasto 💰
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorder;
