
-- Criar tabela para gerenciar assinaturas do Mercado Pago
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  mercadopago_subscription_id TEXT,
  mercadopago_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  plan_type TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC NOT NULL DEFAULT 9.90,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_recurring BOOLEAN DEFAULT true
);

-- Adicionar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
  ON public.subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para atualizar o status premium do usuário
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a assinatura está ativa, marcar usuário como premium
  IF NEW.status = 'approved' OR NEW.status = 'authorized' THEN
    UPDATE public.profiles 
    SET 
      is_premium = TRUE,
      subscription_status = 'active'
    WHERE id = NEW.user_id;
  -- Se a assinatura foi cancelada/rejeitada, remover premium
  ELSIF NEW.status = 'cancelled' OR NEW.status = 'rejected' THEN
    UPDATE public.profiles 
    SET 
      is_premium = FALSE,
      subscription_status = 'cancelled'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar status premium automaticamente
CREATE TRIGGER update_premium_status_trigger
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_premium_status();
