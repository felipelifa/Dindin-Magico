import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const VoiceRecorderButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Para gravar uma frase por vez
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
        setIsListening(false);
        isHoldingRef.current = false;
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        isHoldingRef.current = false;
      };
    }
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Reconhecimento de voz não suportado",
        description: "Seu navegador não suporta reconhecimento de voz.",
        variant: "destructive"
      });
      return;
    }
    setTranscript('');
    setIsListening(true);
    isHoldingRef.current = true;
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    isHoldingRef.current = false;
    recognitionRef.current?.stop();
  };

  const saveExpenseFromTranscript = async () => {
    if (!transcript.trim()) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const text = transcript.toLowerCase();
      let amount = 0;
      let description = transcript;
      let category = 'outros';

      // Detecta valor
      const amountMatch = text.match(/(?:r\$\s*)?(\d+(?:[,\.]\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', '.'));
      }

      // Detecta categoria
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
        setTranscript('');
      } else {
        toast({
          title: "Valor não identificado",
          description: "Não consegui identificar o valor na nota de voz",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar gasto",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  // Apresentação do botão igual aos outros
  return (
    <div className="flex flex-col w-full">
      <Button
        onClick={isListening ? stopListening : startListening}
        className={`h-16 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl w-full mb-2`}
        disabled={isSaving}
      >
        {isListening ? (
          <>
            <MicOff className="w-6 h-6 mr-2 animate-pulse" />
            Gravando... (clique para parar)
          </>
        ) : (
          <>
            <Mic className="w-6 h-6 mr-2" />
            Anotação por voz
          </>
        )}
      </Button>

      {/* Transcrição aparece abaixo do botão */}
      {transcript && (
        <div className="bg-gray-100 rounded-lg p-3 mb-2 text-gray-800 shadow-sm">
          <div className="font-semibold mb-1">Transcrição:</div>
          <div className="text-sm">{transcript}</div>
          <Button
            onClick={saveExpenseFromTranscript}
            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white"
            disabled={isSaving}
          >
            {isSaving ? (<><Loader2 className="animate-spin w-4 h-4 mr-2" /> Salvando...</>) : <>Salvar como Gasto 💰</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderButton;
