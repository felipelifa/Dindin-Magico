import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Square, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface VoiceNoteRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceNoteRecorder = ({ isOpen, onClose }: VoiceNoteRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Gravação iniciada! 🎤",
        description: "Fale sua nota de voz..."
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro ao iniciar gravação",
        description: "Verifique se o microfone está disponível",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      toast({
        title: "Gravação finalizada! ✅",
        description: "Agora você pode reproduzir ou transcrever"
      });
    }
  };

  const playAudio = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        setTranscription(data.text || 'Não foi possível transcrever o áudio');
        toast({
          title: "Áudio transcrito! 📝",
          description: "A transcrição está pronta"
        });
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Erro na transcrição",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveExpenseFromTranscription = async () => {
    if (!transcription.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Parse basic info from transcription (simple approach)
      const text = transcription.toLowerCase();
      let amount = 0;
      let description = transcription;
      let category = 'outros';

      // Try to extract amount (look for numbers with R$, reais, etc.)
      const amountMatch = text.match(/(?:r\$\s*)?(\d+(?:[,\.]\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', '.'));
      }

      // Try to extract category based on keywords
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
            description: Nota de voz: ${description},
            category,
            date: new Date().toISOString().split('T')[0],
            emoji: '🎤'
          });

        if (error) throw error;

        toast({
          title: "Gasto salvo! 💰",
          description: R$ ${amount.toFixed(2)} registrado com sucesso
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
    setIsRecording(false);
    setIsPlaying(false);
    setAudioBlob(null);
    setTranscription('');
    setRecordingTime(0);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ${mins}:${secs.toString().padStart(2, '0')};
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nota de Voz 🎤
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            {isRecording && (
              <div className="text-xl font-bold text-red-600">
                🔴 {formatTime(recordingTime)}
              </div>
            )}
            
            <div className="flex gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-full w-16 h-16"
                >
                  <Square className="w-8 h-8" />
                </Button>
              )}
            </div>
          </div>

          {/* Audio Playback */}
          {audioBlob && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {!isPlaying ? (
                  <Button
                    onClick={playAudio}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Reproduzir
                  </Button>
                ) : (
                  <Button
                    onClick={pauseAudio}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pausar
                  </Button>
                )}
                
                <Button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isTranscribing ? 'Transcrevendo...' : 'Transcrever'}
                </Button>
              </div>
              
              {transcription && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Transcrição:</h4>
                  <p className="text-sm text-gray-700">{transcription}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={saveExpenseFromTranscription}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Salvar como Gasto 💰
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
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

export default VoiceNoteRecorder;